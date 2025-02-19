/**
 * Blockchain Client Configuration
 * 
 * This module configures Viem clients for interacting with the Base network.
 * It sets up both public and wallet clients with proper authentication.
 * 
 * Features:
 * - Public client for read operations
 * - Wallet client for transactions
 * - Local transaction signing
 * - Automatic gas estimation
 * 
 * Network Configuration:
 * - Chain: Base (Ethereum L2)
 * - Transport: HTTP
 * - Account: Local private key
 * 
 * Security:
 * - Private key never exposed
 * - Local transaction signing
 * - No key transmission
 * 
 * Client Capabilities:
 * Public Client:
 * - Read contract state
 * - Query transactions
 * - Estimate gas
 * 
 * Wallet Client:
 * - Sign transactions
 * - Deploy contracts
 * - Write contract state
 * 
 * Required Environment Variables:
 * - PRIVATE_KEY: Ethereum private key
 *   Format: 0x-prefixed hex string
 * - BASE_RPC_URL: Base network RPC endpoint
 *   Format: https://[network].base.org
 * 
 * Usage Notes:
 * - All transactions are signed locally
 * - Gas fees paid in ETH
 * - Supports EIP-1559 transactions
 */

import { base } from "viem/chains";
import { http, createPublicClient, createWalletClient, Chain } from "viem";
import { privateKeyToAccount } from 'viem/accounts';

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

if (!process.env.BASE_RPC_URL) {
  throw new Error('BASE_RPC_URL environment variable is required');
}

export const chain = base;

// Initialize wallet account from private key
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

// Create clients with Base RPC URL
const transport = http(process.env.BASE_RPC_URL);

export const publicClient = createPublicClient({
  chain: base as Chain,
  transport,
});

// Create wallet client with local account
export const walletClient = createWalletClient({
  chain: base as Chain,
  transport,
  account // account from privateKeyToAccount already handles local signing
});

// Export account and addresses
export const creatorAccount = account.address;
export const minterAccount = account.address;
export const randomAccount = account.address;
export { account };
