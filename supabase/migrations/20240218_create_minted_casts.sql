-- Migration: Create minted_casts table for storing NFT minting history
--
-- This table stores a complete record of all minted casts including:
-- - Cast details (hash, caster, minter)
-- - NFT details (Zora URL, contract, token)
-- - Timestamps for tracking
--
-- Security:
-- - Row Level Security (RLS) enabled
-- - Service role has full access for backend operations
-- - Public read access for frontend queries
--
-- Indexes:
-- - Primary key on id (UUID)
-- - Index on cast_hash for fast lookups
-- - Unique constraint on cast_hash to prevent duplicates

-- Create minted_casts table with complete metadata
create table if not exists minted_casts (
  id uuid default gen_random_uuid() primary key,
  cast_hash text not null unique,
  zora_url text not null,
  caster_username text not null,
  minter_username text not null,
  mint_hash text not null,
  minted_at timestamp with time zone not null,
  contract_address text,
  token_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on cast_hash for faster lookups of existing mints
create index if not exists minted_casts_cast_hash_idx on minted_casts(cast_hash);

-- Enable Row Level Security (RLS) for controlled access
alter table minted_casts enable row level security;

-- Create policy for service role (backend) operations
-- Allows all CRUD operations when authenticated as service role
create policy "Service role full access"
  on minted_casts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Create policy for public read access
-- Allows anyone to read minting data but not modify it
create policy "Public read access"
  on minted_casts
  for select
  using (true);
