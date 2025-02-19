/**
 * Neynar API Service
 * 
 * This module provides functionality to interact with the Neynar API for fetching
 * Farcaster cast data. It includes robust error handling, retries, and timeouts.
 * 
 * Features:
 * - Automatic retries for failed requests
 * - Request timeout handling
 * - Rate limit handling
 * - Detailed error reporting
 * - Type-safe responses
 */

import { CastData } from '../types';
import { APIError } from '../utils/error-handler';

// Configuration constants
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const MAX_RETRIES = 3;          // Maximum number of retry attempts
const TIMEOUT_MS = 5000;        // Request timeout in milliseconds
const RETRY_DELAY_MS = 1000;    // Base delay between retries in milliseconds

/**
 * Interface for Neynar API response
 */
interface NeynarResponse {
  cast: CastData;
}

/**
 * Fetches a URL with timeout functionality
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds
 * @returns Promise resolving to the fetch Response
 * @throws Error if the request times out
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Delays execution for specified milliseconds
 * 
 * @param ms - Delay duration in milliseconds
 * @returns Promise that resolves after the delay
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetches cast data from Neynar API
 * 
 * Makes a request to Neynar's API to fetch cast data by hash. Includes:
 * - Input validation
 * - Configuration checks
 * - Automatic retries for transient failures
 * - Comprehensive error handling
 * 
 * @param hash - The cast hash to fetch
 * @returns Promise resolving to the cast data
 * @throws APIError for various error conditions (invalid input, not found, rate limit, etc.)
 */
export async function getCast(hash: string): Promise<CastData> {
  if (!NEYNAR_API_KEY) {
    throw new APIError('Neynar API key is not configured', 500, 'CONFIGURATION_ERROR');
  }

  if (!hash) {
    throw new APIError('Cast hash is required', 400, 'VALIDATION_ERROR');
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `https://api.neynar.com/v2/farcaster/cast?identifier=${hash}&type=hash`,
        {
          headers: {
            'api_key': NEYNAR_API_KEY,
            'Accept': 'application/json'
          }
        },
        TIMEOUT_MS
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new APIError('Cast not found', 404, 'CAST_NOT_FOUND');
        }
        
        if (response.status === 429) {
          throw new APIError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
        }
        
        throw new APIError(
          errorData.message || 'Failed to fetch cast',
          response.status,
          'NEYNAR_API_ERROR'
        );
      }

      const data: NeynarResponse = await response.json();
      
      if (!data.cast) {
        throw new APIError('Invalid response format from Neynar', 500, 'INVALID_RESPONSE');
      }

      return data.cast;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof APIError && 
          (error.statusCode === 400 || error.statusCode === 404)) {
        throw error;
      }
      
      // Last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        throw error;
      }
      
      // Wait before retrying
      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  // This should never happen due to the throw in the loop
  throw lastError || new APIError('Failed to fetch cast after retries');
}
