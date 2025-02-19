/**
 * Redis Queue System Implementation
 * 
 * This module implements a reliable queue system using Redis for NFT minting operations.
 * It provides connection management, queue operations, and deduplication functionality.
 * 
 * Queue Architecture:
 * - mint_queue: Main processing queue for pending mints (FIFO)
 * - failed_mint_queue: Storage for failed mints with error details
 * - processed_casts: SET for deduplication tracking
 * 
 * Connection Management:
 * - Implements Singleton pattern for Redis client
 * - Automatic connection handling and recovery
 * - Event monitoring for connection issues
 * - Graceful shutdown support
 * 
 * Queue Operations:
 * - enqueueCast: Add new cast to mint queue (LPUSH)
 * - dequeueCast: Get next cast from queue (RPOP)
 * - peekQueue: Check next item without removal
 * - addToFailedQueue: Store failed mints with error details
 * 
 * Deduplication:
 * - Uses Redis SET for O(1) lookup of processed casts
 * - Prevents duplicate minting of same cast
 * - Permanent storage of processed state
 * 
 * Error Handling:
 * - Connection error monitoring and logging
 * - Automatic reconnection attempts
 * - Failed mint tracking with timestamps
 * 
 * Required Environment Variables:
 * - REDIS_URL: Connection URL with authentication
 *   Format: redis[s]://[[username][:password]@][host][:port][/db-number]
 */

import { createClient } from 'redis';

// Queue names
export const MINT_QUEUE = 'mint_queue';
export const FAILED_MINT_QUEUE = 'failed_mint_queue';

// Singleton Redis client
class RedisConnection {
  private static instance: RedisConnection;
  private client: ReturnType<typeof createClient> | null = null;
  private connecting = false;

  private constructor() {}

  static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  async getClient() {
    if (!this.client) {
      this.client = createClient({
        url: process.env.REDIS_URL
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
      });
    }

    if (!this.client.isOpen && !this.connecting) {
      try {
        this.connecting = true;
        await this.client.connect();
      } catch (error) {
        console.error('Redis Connection Error:', error);
        throw error;
      } finally {
        this.connecting = false;
      }
    }

    return this.client;
  }
}

// Get Redis client instance
export const getRedisClient = async (): Promise<ReturnType<typeof createClient>> => {
  return await RedisConnection.getInstance().getClient();
};

// Redis operations with automatic connection handling
const redis = {
  async sAdd(key: string, value: string) {
    const client = await getRedisClient();
    return await client.sAdd(key, value);
  },

  async sIsMember(key: string, value: string) {
    const client = await getRedisClient();
    return await client.sIsMember(key, value);
  },

  async lPush(key: string, value: string) {
    const client = await getRedisClient();
    return await client.lPush(key, value);
  },

  async lRange(key: string, start: number, stop: number) {
    const client = await getRedisClient();
    return await client.lRange(key, start, stop);
  },

  async rPop(key: string) {
    const client = await getRedisClient();
    return await client.rPop(key);
  },

  async quit() {
    const client = await getRedisClient();
    if (client.isOpen) {
      await client.quit();
    }
  }
};

/**
 * Marks a cast as processed in Redis to prevent duplicate processing.
 * Uses Redis SET to store the cast hash.
 * 
 * @param castHash - The unique hash of the cast to mark as processed
 */
export async function markCastAsProcessed(castHash: string): Promise<void> {
  await redis.sAdd('processed_casts', castHash);
}

/**
 * Checks if a cast has already been processed.
 * Uses Redis SET membership check.
 * 
 * @param castHash - The unique hash of the cast to check
 * @returns Promise<boolean> - True if cast was already processed
 */
export async function isCastProcessed(castHash: string): Promise<boolean> {
  return await redis.sIsMember('processed_casts', castHash);
}

/**
 * Adds a cast to the minting queue.
 * 
 * @param data - Cast data to be processed
 * @returns Promise<number> - Length of queue after adding
 */
interface CastAuthor {
  username: string;
  display_name?: string;
  pfp_url?: string;
  text?: string;
  fid: number;
  verified_addresses?: {
    eth_addresses?: string[];
  };
}

export interface QueuedCast {
  castHash: string;
  parentHash: string;
  text: string;
  author: CastAuthor;
  parentAuthor: CastAuthor;
  timestamp: string;
}

export async function enqueueCast(data: QueuedCast): Promise<number> {
  return await redis.lPush(MINT_QUEUE, JSON.stringify(data));
}

/**
 * Gets the next cast from the queue without removing it.
 * Useful for checking queue status.
 * 
 * @returns Promise<any> - Next cast data or null if queue is empty
 */
export async function peekQueue(): Promise<QueuedCast | null> {
  const data = await redis.lRange(MINT_QUEUE, 0, 0);
  if (!data || data.length === 0) return null;
  return JSON.parse(data[0]);
}

/**
 * Gets and removes the next cast from the queue.
 * 
 * @returns Promise<any> - Next cast data or null if queue is empty
 */
export async function dequeueCast(): Promise<QueuedCast | null> {
  const data = await redis.rPop(MINT_QUEUE);
  if (!data) return null;
  return JSON.parse(data);
}

/**
 * Adds a failed mint to the retry queue.
 * 
 * @param data - Cast data that failed to mint
 * @param error - Error information
 * @returns Promise<number> - Length of retry queue after adding
 */
interface FailedMint extends QueuedCast {
  error: string;
  failedAt: string;
}

export async function addToFailedQueue(data: QueuedCast, error: string): Promise<number> {
  const failedMint = {
    ...data,
    error,
    failedAt: new Date().toISOString(),
  };
  return await redis.lPush(FAILED_MINT_QUEUE, JSON.stringify(failedMint));
}

/**
 * Gets all failed mints.
 * 
 * @returns Promise<any[]> - Array of failed mints with error details
 */
export async function getFailedMints(): Promise<FailedMint[]> {
  const data = await redis.lRange(FAILED_MINT_QUEUE, 0, -1);
  return data.map(item => JSON.parse(item));
}

export default redis;
