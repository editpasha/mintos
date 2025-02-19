/**
 * NFT Minting Queue Worker
 * 
 * This worker process handles the asynchronous minting of NFTs from Farcaster casts.
 * It implements a reliable queue system with retries, error handling, and health monitoring.
 * 
 * Key Features:
 * - Single-item processing to ensure reliability
 * - Automatic retries with configurable delays
 * - Comprehensive error handling and logging
 * - Health monitoring and metrics
 * - Graceful shutdown handling
 * 
 * Process Flow:
 * 1. Dequeues cast data from Redis
 * 2. Fetches parent cast details from Neynar
 * 3. Creates and uploads preview image to IPFS
 * 4. Creates metadata and uploads to IPFS
 * 5. Creates split contract for revenue sharing
 * 6. Mints NFT with metadata and split contract
 * 7. Posts confirmation reply with mint frame
 * 
 * Configuration:
 * - RETRY_DELAY: Time between processing attempts (default: 5000ms)
 * - MAX_RETRIES: Maximum API call retry attempts (default: 3)
 * - API_TIMEOUT: API call timeout (default: 30000ms)
 * 
 * Required Environment Variables:
 * - API_KEY: Internal API authentication
 * - NEYNAR_API_KEY: Neynar API access
 * - NEYNAR_SIGNER_UUID: Neynar signer for replies
 * - NEXT_PUBLIC_CONTRACT_ADDRESS: NFT contract address
 * - REDIS_URL: Redis connection URL
 * - NEXT_PUBLIC_APP_URL: Base URL for internal API calls
 * - WORKER_PROCESS: Must be 'true' to run as worker
 * 
 * Health Monitoring:
 * Exposes health metrics including:
 * - Current queue size
 * - Failed mints count
 * - Last processed timestamp
 * - Worker status
 * - Error history
 */

import { dequeueCast, addToFailedQueue, markCastAsProcessed, peekQueue, getFailedMints } from '../lib/redis';
import { storeMintedNFT } from '../lib/supabase';
import { neynarClient } from '../lib/neynar';

const RETRY_DELAY = 5000; // 5 seconds between processing attempts
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Internal API base URL
const MAX_RETRIES = 3; // Maximum number of retries for API calls
const API_TIMEOUT = 30000; // 30 seconds timeout for API calls
let isProcessing = false;
let lastProcessedTime: string | null = null;
const queueHealth = {
  status: 'starting',
  lastProcessed: null as string | null,
  currentQueueSize: 0,
  failedMintsCount: 0,
  errors: [] as string[]
};

// Helper function for API calls with retries
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries > 0 && error instanceof Error && error.name !== 'AbortError') {
      console.log(`Retrying API call to ${url}, ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Check required environment variables
const requiredEnvVars = {
  'API_KEY': process.env.API_KEY,
  'NEYNAR_API_KEY': process.env.NEYNAR_API_KEY,
  'NEYNAR_SIGNER_UUID': process.env.NEYNAR_SIGNER_UUID,
  'NEXT_PUBLIC_CONTRACT_ADDRESS': process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  'REDIS_URL': process.env.REDIS_URL,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL
};

for (const [name, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    const error = `${name} environment variable is required`;
    console.error(error);
    queueHealth.errors.push(error);
    queueHealth.status = 'error';
    process.exit(1);
  }
}

// Initialize Redis connection
import redis, { getRedisClient } from '../lib/redis';

// Only initialize Redis if this is the worker process
const isWorkerProcess = process.env.WORKER_PROCESS === 'true';

// Health check endpoint data
async function getHealthStatus() {
  try {
    // Get current queue size
    const nextItem = await peekQueue();
    const failedMints = await getFailedMints();
    
    queueHealth.currentQueueSize = nextItem ? 1 : 0;
    queueHealth.failedMintsCount = failedMints.length;
    queueHealth.lastProcessed = lastProcessedTime;
    
    return queueHealth;
  } catch (error) {
    console.error('Error getting health status:', error);
    return {
      ...queueHealth,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function processQueueItem() {
  // Check shutdown status
  if (isShuttingDown) {
    console.log('Shutdown in progress, skipping next item');
    return;
  }

  if (isProcessing) {
    console.log('Already processing an item, skipping...');
    setTimeout(processQueueItem, RETRY_DELAY);
    return;
  }

  // Get next item from queue
  console.log('Checking queue for items...');
  const data = await dequeueCast();
  if (!data) {
    // Update health status
    console.log('Queue empty, waiting for new items...');
    queueHealth.status = 'idle';
    queueHealth.currentQueueSize = 0;
    
    // Schedule next check and return
    setTimeout(processQueueItem, RETRY_DELAY);
    return;
  }
  console.log('Found item in queue:', data.castHash);

  try {
    isProcessing = true;
    queueHealth.status = 'processing';
    
    console.log('Processing mint for cast:', data.castHash, 'Parent cast:', data.parentHash);
    console.log('Cast data:', JSON.stringify(data, null, 2));

    // Get minter's ETH address from the mint command
    if (!data.author.verified_addresses?.eth_addresses?.[0]) {
      throw new Error('Minter has no verified ETH address');
    }
    const minterWallet = data.author.verified_addresses.eth_addresses[0];

    // Get parent cast data first
    console.log('Fetching parent cast data from Neynar...');
    const parentCastResponse = await fetchWithRetry(
      `https://api.neynar.com/v2/farcaster/cast?identifier=${data.parentHash}&type=hash`,
      {
        headers: {
          'api_key': process.env.NEYNAR_API_KEY || ''
        }
      }
    );

    if (!parentCastResponse.ok) {
      throw new Error(`Failed to fetch parent cast: ${parentCastResponse.status}`);
    }

    const parentCastData = await parentCastResponse.json();
    const parentCast = parentCastData.cast;

    if (!parentCast) {
      throw new Error('Parent cast not found');
    }

    // Get parent cast author's details from Neynar API
    console.log('Fetching parent cast author details from Neynar...');
    const userResponse = await fetchWithRetry(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${parentCast.author.fid}`,
      {
        headers: {
          'api_key': process.env.NEYNAR_API_KEY || '',
          'x-neynar-experimental': 'true'
        }
      }
    );

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch parent author details: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    const parentAuthor = userData.users[0];

    if (!parentAuthor?.verified_addresses?.eth_addresses?.[0]) {
      throw new Error('Parent cast author has no verified ETH address');
    }
    const casterWallet = parentAuthor.verified_addresses.eth_addresses[0];

    // Store parent cast author details for metadata
    const parentAuthorUsername = parentCast.author.username;
    const parentCastText = parentCast.text;

    console.log('Found wallet addresses:', {
      casterWallet,
      minterWallet
    });

    // 1. Create image and upload to IPFS
    console.log('Creating image and uploading to IPFS for parent cast:', data.parentHash);
    console.log('API configuration:', {
      baseUrl: API_BASE,
      apiKey: process.env.API_KEY ? 'configured' : 'missing',
      endpoint: `${API_BASE}/api/createImage`
    });

    const imageRequestBody = { hash: data.parentHash };
    console.log('Image request payload:', imageRequestBody);

    const imageResponse = await fetchWithRetry(`${API_BASE}/api/createImage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY || '',
      },
      body: JSON.stringify(imageRequestBody)
    });

    console.log('Image API response status:', {
      status: imageResponse.status,
      statusText: imageResponse.statusText,
      headers: Object.fromEntries(imageResponse.headers.entries())
    });

    if (!imageResponse.ok) {
      const responseText = await imageResponse.text();
      console.error('Image creation failed:', {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        responseText,
        headers: Object.fromEntries(imageResponse.headers.entries())
      });

      let errorJson;
      try {
        errorJson = JSON.parse(responseText);
        console.error('Parsed error response:', errorJson);
      } catch (e) {
        console.error('Failed to parse error response as JSON:', e);
        errorJson = { error: responseText };
      }

      throw new Error(`Failed to create image (${imageResponse.status}): ${errorJson.error || responseText || 'Unknown error'}`);
    }

    const imageResponseData = await imageResponse.json();
    console.log('Successfully created image:', imageResponseData);
    const { url: imageUri } = imageResponseData;

    // Create metadata with parent cast author details
    const metadata = {
      name: `Cast by ${parentAuthorUsername}`,
      description: parentCastText,
      image: imageUri,
      properties: {
        casterUsername: parentAuthorUsername,
        minterUsername: data.author.username,
        castHash: data.parentHash,
        mintHash: data.castHash,
        timestamp: data.timestamp
      }
    };

    // Upload metadata to IPFS
    console.log('Uploading metadata to IPFS:', JSON.stringify(metadata, null, 2));
    const metadataResponse = await fetchWithRetry(`${API_BASE}/api/ipfs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY || '',
      },
      body: JSON.stringify(metadata)
    });

    if (!metadataResponse.ok) {
      const error = await metadataResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(`Failed to upload metadata to IPFS (${metadataResponse.status}): ${error.error || 'Unknown error'}`);
    }

    const { url: metadataUri } = await metadataResponse.json();

    // 3. Create split contract
    console.log('Creating split contract for caster:', casterWallet, 'and minter:', minterWallet);
    const splitResponse = await fetchWithRetry(`${API_BASE}/api/createSplit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY || '',
      },
      body: JSON.stringify({
        casterWallet,
        minterWallet
      })
    });

    if (!splitResponse.ok) {
      const error = await splitResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(`Failed to create split contract (${splitResponse.status}): ${error.error || 'Unknown error'}`);
    }

    const { split } = await splitResponse.json();

    // 4. Create NFT
    console.log('Creating NFT with metadata URI:', metadataUri);
    const tokenResponse = await fetchWithRetry(`${API_BASE}/api/createToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY || '',
      },
      body: JSON.stringify({
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        tokenUri: metadataUri,
        splitAddress: split.address
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(`Failed to create token (${tokenResponse.status}): ${error.error || 'Unknown error'}`);
    }

    const { token } = await tokenResponse.json();
    console.log('NFT created successfully:', token);

    // Format Zora URL with referrer
    const zoraUrl = `https://zora.co/collect/base:${token.contractAddress}/${token.tokenId}?referrer=0xB70399fc376c1B3Cf3493556d2f14942323eF44f`;
    
    // Store minted NFT data
    await storeMintedNFT({
      castHash: data.parentHash,
      zoraUrl,
      casterUsername: parentAuthorUsername,
      minterUsername: data.author.username,
      mintHash: data.castHash,
      timestamp: data.timestamp,
      contractAddress: token.contractAddress,
      tokenId: token.tokenId
    });
    
    // Mark cast as processed
    await markCastAsProcessed(data.parentHash);
    
    // Post reply with mint frame
    const replyText = `This cast has been minted by @${data.author.username}\n\nCollect here: ${zoraUrl}`;
    await neynarClient.publishCast({
      signer_uuid: process.env.NEYNAR_SIGNER_UUID!,
      text: replyText,
      parent: data.parentHash,
      embeds: [{
        url: zoraUrl
      }]
    });

    console.log('Successfully processed mint for cast:', data.castHash);
    
    // Update health metrics
    lastProcessedTime = new Date().toISOString();
    queueHealth.lastProcessed = lastProcessedTime;
    queueHealth.status = 'success';
    
  } catch (error) {
    console.error('Error processing mint:', error);
    console.error('Error details:', {
      castHash: data?.castHash,
      parentHash: data?.parentHash,
      error: error instanceof Error ? error.stack : String(error)
    });
    
    // Update health metrics
    queueHealth.status = 'error';
    queueHealth.errors.push(error instanceof Error ? error.message : String(error));
    
    // Add to failed queue for retry
    if (error instanceof Error) {
      await addToFailedQueue(data, error.message);
      queueHealth.failedMintsCount++;
    }
  } finally {
    isProcessing = false;
    // Schedule next processing
    setTimeout(processQueueItem, RETRY_DELAY);
  }
}

// Graceful shutdown handler
let isShuttingDown = false;

async function shutdown() {
  console.log('Shutting down worker...');
  isShuttingDown = true;
  queueHealth.status = 'shutting_down';
  
  // Wait for current processing to finish
  if (isProcessing) {
    console.log('Waiting for current item to finish processing...');
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!isProcessing) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 1000);
    });
  }
  
  // Close Redis connection
  await redis.quit();
  console.log('Worker shutdown complete');
  queueHealth.status = 'shutdown';
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Initialize worker using IIFE to avoid top-level await
(function initializeWorker() {
  if (!isWorkerProcess) return;

  console.log('Worker process check:', {
    isWorkerProcess,
    redisUrl: process.env.REDIS_URL ? 'configured' : 'missing',
    envVars: Object.keys(process.env).filter(key => key.includes('WORKER') || key.includes('REDIS'))
  });

  getRedisClient()
    .then(() => {
      console.log('Redis connected successfully');
      queueHealth.status = 'connected';
      
      console.log('Worker configuration:', {
        apiBase: API_BASE,
        retryDelay: RETRY_DELAY,
        maxRetries: MAX_RETRIES,
        apiTimeout: API_TIMEOUT
      });

      return processQueueItem();
    })
    .catch(error => {
      console.error('Failed to initialize Redis:', error);
      queueHealth.status = 'connection_failed';
      queueHealth.errors.push(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
})();

// Export health check data
export { getHealthStatus };
