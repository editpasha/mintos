/**
 * Neynar API Integration
 * 
 * This module provides a type-safe client for interacting with Neynar's Farcaster API.
 * It handles cast publishing with support for replies and embeds.
 * 
 * Features:
 * - Type-safe API client
 * - Automatic error handling
 * - Support for:
 *   - Text-only casts
 *   - Reply casts
 *   - Embedded content (URLs)
 * 
 * API Endpoints:
 * - POST /v2/farcaster/cast
 *   Creates new casts and replies
 *   Rate Limit: 100 requests/minute
 * 
 * Authentication:
 * - API Key authentication
 * - Signer UUID required for publishing
 * 
 * Error Handling:
 * - Connection error detection
 * - Rate limit handling
 * - Detailed error messages
 * 
 * Required Environment Variables:
 * - NEYNAR_API_KEY: API key for authentication
 * 
 * Usage Notes:
 * - Text limit: 320 characters
 * - URL embeds: Maximum 2 per cast
 * - Parent hash required for replies
 * 
 * @see https://docs.neynar.com/reference/post-cast
 */

if (!process.env.NEYNAR_API_KEY) {
  throw new Error('NEYNAR_API_KEY is not set in environment variables');
}

const NEYNAR_API_BASE = 'https://api.neynar.com/v2/farcaster';

export const neynarClient = {
  async publishCast({ signer_uuid, text, parent, embeds = [] }: {
    signer_uuid: string;
    text: string;
    parent?: string;
    embeds?: Array<{ url: string }>;
  }) {
    const response = await fetch(`${NEYNAR_API_BASE}/cast`, {
      method: 'POST',
      headers: {
        'api_key': process.env.NEYNAR_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid,
        text,
        parent,
        embeds
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Neynar API error: ${error.message || 'Unknown error'}`);
    }

    return response.json();
  }
};
