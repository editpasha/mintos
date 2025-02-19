/**
 * Enhanced API utility functions for making authenticated requests to our backend
 */

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// API endpoints as constants
const API_ENDPOINTS = {
  IPFS: '/api/ipfs',
  CONTRACT: '/api/createContract',
  TOKEN: '/api/createToken',
  SPLIT: '/api/createSplit'
} as const;

// Response types for each endpoint
interface IpfsResponse {
  hash: string;
  url: string;
}

interface ContractResponse {
  success: boolean;
  error?: string;
  contract?: {
    address: string;
    transactionHash: string;
    factoryAddress: string;
  }
}

interface TokenResponse {
  success: boolean;
  error?: string;
  token?: {
    transactionHash: string;
    contractAddress: string;
    splitAddress: string;
  }
}

interface SplitResponse {
  success: boolean;
  error?: string;
  split?: {
    address: string;
    transactionHash?: string;
    shares?: {
      caster: string;
      minter: string;
      platform: string;
    }
  }
}

// Replace any with structured types
interface JsonObject {
  [key: string]: string | number | boolean | null | JsonObject | JsonObject[];
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  headers?: Record<string, string>;
  body?: BodyInit | null | JsonObject;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Custom error class for API errors
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private rateLimit = 100; // ms between requests

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
        await new Promise(resolve => setTimeout(resolve, this.rateLimit));
      }
    }
    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

// Retry logic with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

/**
 * Enhanced fetch API with timeout, retry, and queue support
 */
async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    ...fetchOptions
  } = options;

  // Prepare headers
  const headers = new Headers({
    'x-api-key': API_KEY || '',
    ...(options.headers || {})
  });

  let body = options.body;
  
  // Handle JSON body
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchWithTimeout = async () => {
    try {
      const response = await fetch(endpoint, {
        ...fetchOptions,
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.message || 'An error occurred',
          response.status,
          error
        );
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Add request to queue with retry logic
  return requestQueue.add(() => 
    retryWithBackoff(fetchWithTimeout, retries, retryDelay)
  );
}

/**
 * Enhanced API methods with proper typing and validation
 */
export const api = {
  uploadToIpfs: async (data: BodyInit): Promise<IpfsResponse> => {
    return fetchApi(API_ENDPOINTS.IPFS, {
      method: 'POST',
      body: data,
    });
  },

  createContract: async (data: {
    name: string;
    uri: string;
    tokenUri: string;
  }): Promise<ContractResponse> => {
    return fetchApi(API_ENDPOINTS.CONTRACT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    });
  },

  createToken: async (data: {
    contractAddress: string;
    tokenUri: string;
    splitAddress: string;
  }): Promise<TokenResponse> => {
    return fetchApi(API_ENDPOINTS.TOKEN, {
      method: 'POST',
      body: data,
    });
  },

  createSplit: async (data: { casterWallet: string; minterWallet: string }): Promise<SplitResponse> => {
    return fetchApi(API_ENDPOINTS.SPLIT, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

};

// Warning if API key is not set
if (!API_KEY) {
  console.warn('NEXT_PUBLIC_API_KEY is not set in environment variables');
}
