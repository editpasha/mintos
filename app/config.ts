/**
 * Server-Side Configuration
 * 
 * This module provides server-side configuration values and environment variables
 * required for blockchain operations. This file is protected by being in the app
 * directory which is server-side only by default in Next.js.
 * 
 * Environment Variables Required:
 * - PRIVATE_KEY: Ethereum private key for transaction signing
 */

import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

/** Private key for transaction signing, typed as hex string */
export const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
