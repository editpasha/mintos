/**
 * Supabase Database Integration
 * 
 * This module manages persistent storage of NFT minting data using Supabase.
 * It implements a secure and efficient database layer with complete metadata tracking.
 * 
 * Database Schema (minted_casts):
 * - cast_hash: text PRIMARY KEY (unique identifier)
 * - zora_url: text NOT NULL (NFT collection URL)
 * - caster_username: text NOT NULL (original content creator)
 * - minter_username: text NOT NULL (NFT minter)
 * - mint_hash: text NOT NULL (minting transaction hash)
 * - minted_at: timestamp NOT NULL (minting timestamp)
 * - contract_address: text (NFT contract address)
 * - token_id: text (NFT token identifier)
 * 
 * Security:
 * - Uses service role key for elevated database privileges
 * - Row Level Security (RLS) enabled:
 *   - Public read access for queries
 *   - Write access restricted to service role
 * - Indexed fields for efficient lookups:
 *   - cast_hash (PRIMARY KEY)
 *   - mint_hash
 *   - minted_at
 * 
 * Error Handling:
 * - Graceful handling of not-found cases
 * - Detailed error propagation
 * - Type-safe database operations
 * 
 * Required Environment Variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Project URL
 *   Format: https://[project-ref].supabase.co
 * - SUPABASE_SERVICE_KEY: Service role key
 *   Note: Keep this secret, used only server-side
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Represents a minted cast in the database
 */
export interface MintedCast {
  cast_hash: string;
  zora_url: string;
  caster_username: string;
  minter_username: string;
  mint_hash: string;
  minted_at: string;
  contract_address?: string;
  token_id?: string;
}

/**
 * Stores a newly minted NFT in the database with complete metadata.
 * 
 * @param data - Object containing all minting details
 * @param data.castHash - Unique hash of the original cast
 * @param data.zoraUrl - URL to the minted NFT on Zora
 * @param data.casterUsername - Username of the cast creator
 * @param data.minterUsername - Username of the person who minted
 * @param data.mintHash - Hash of the mint transaction
 * @param data.timestamp - When the mint occurred
 * @param data.contractAddress - Optional contract address
 * @param data.tokenId - Optional token ID
 */
export async function storeMintedNFT(data: {
  castHash: string;
  zoraUrl: string;
  casterUsername: string;
  minterUsername: string;
  mintHash: string;
  timestamp: string;
  contractAddress?: string;
  tokenId?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('minted_casts')
    .insert([{
      cast_hash: data.castHash,
      zora_url: data.zoraUrl,
      caster_username: data.casterUsername,
      minter_username: data.minterUsername,
      mint_hash: data.mintHash,
      minted_at: data.timestamp,
      contract_address: data.contractAddress,
      token_id: data.tokenId
    }]);

  if (error) throw error;
}

/**
 * Retrieves the Zora URL for a previously minted cast.
 * 
 * @param castHash - The unique hash of the cast to look up
 * @returns Promise<string | null> - Zora URL if found, null if not minted
 */
export async function getMintedNFT(castHash: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('minted_casts')
    .select('zora_url')
    .eq('cast_hash', castHash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }

  return data?.zora_url || null;
}

/**
 * Retrieves complete minting details for a cast.
 * Includes all metadata like caster, minter, timestamps, etc.
 * 
 * @param castHash - The unique hash of the cast to look up
 * @returns Promise<MintedCast | null> - Full minting details if found
 */
export async function getMintingDetails(castHash: string): Promise<MintedCast | null> {
  const { data, error } = await supabase
    .from('minted_casts')
    .select('*')
    .eq('cast_hash', castHash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}
