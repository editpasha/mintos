import { NextResponse } from 'next/server'
import { neynarClient } from '../../../lib/neynar'
import { isCastProcessed, enqueueCast } from '../../../lib/redis'
import { getMintingDetails } from '../../../lib/supabase'

/**
 * Webhook handler for Neynar cast events
 * 
 * This endpoint processes incoming Farcaster cast events and handles NFT minting commands.
 * It implements several validation steps and security checks before queueing casts for minting.
 * 
 * Security:
 * - Requires NEYNAR_SIGNER_UUID for authentication
 * - Validates user's Neynar score to prevent spam
 * - Implements deduplication via Redis
 * 
 * Validation Steps:
 * 1. Verifies it's a reply to another cast
 * 2. Checks for valid mint commands (!mint, ok banger, @edit mint)
 * 3. Validates user's Neynar score (minimum 0.69)
 * 4. Ensures parent cast data exists
 * 5. Checks for duplicate processing
 * 
 * @param {Request} request - The incoming webhook request
 * @returns {Promise<NextResponse>} JSON response with status and message
 * 
 * Response Format:
 * ```typescript
 * {
 *   success: boolean;
 *   message?: string;
 *   error?: string;
 *   minter?: string; // Only present for existing mints
 * }
 * ```
 * 
 * Status Codes:
 * - 200: Successfully processed (includes non-mint commands)
 * - 400: Invalid request (missing parent cast)
 * - 500: Server error (configuration or processing error)
 */
export async function POST(request: Request) {
  try {
    // Check required environment variable
    if (!process.env.NEYNAR_SIGNER_UUID) {
      console.error('NEYNAR_SIGNER_UUID environment variable is required');
      return new NextResponse(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse webhook payload
    const body = await request.text();
    const payload = JSON.parse(body)
    console.log('Webhook Payload:', JSON.stringify(payload, null, 2))

    // Check if this is a cast event
    if (payload.type === 'cast.created') {
      const text = payload.data.text.trim();
      const parentHash = payload.data.parent_hash;

      // Check if it's a reply
      if (!parentHash) {
        console.log('Not a reply, ignoring:', payload.data.hash);
        return new NextResponse(JSON.stringify({ success: true, message: 'Not a reply' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if it's a mint command
      if (!text.match(/^(!mint|ok\s+banger|@edit\s+mint)$/i)) {
        console.log('Not a mint command, ignoring:', text);
        return new NextResponse(JSON.stringify({ success: true, message: 'Not a mint command' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check user's neynar score
      const userScore = payload.data.author.experimental?.neynar_user_score;
      if (!userScore || userScore < 0.69) {
        console.log('User score too low:', userScore);
        try {
          // Inform user their score is too low
          await neynarClient.publishCast({
            signer_uuid: process.env.NEYNAR_SIGNER_UUID!,
            text: `Sorry, your Neynar user score (${userScore || 0}) is too low to mint. A minimum score of 0.69 is required.`,
            parent: payload.data.hash,
          });
        } catch (error) {
          console.error('Failed to post score reply:', error);
        }
        return new NextResponse(JSON.stringify({ success: true, message: 'User score too low' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if parent cast data exists
      if (!payload.data.parent_author) {
        console.log('Parent cast data not found:', parentHash);
        return new NextResponse(JSON.stringify({ error: 'Parent cast data not found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('Processing mint command for cast:', parentHash);

      try {
        // Check if cast was already processed
        if (await isCastProcessed(parentHash)) {
          console.log('Cast already processed:', parentHash);
          return new NextResponse(JSON.stringify({ success: true, message: 'Cast already processed' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Check if cast was already minted
        const existingMint = await getMintingDetails(parentHash);
        if (existingMint) {
          console.log('Cast already minted, returning existing NFT:', existingMint.zora_url);
          return new NextResponse(JSON.stringify({ success: true, message: 'Returned existing mint', minter: existingMint.minter_username }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      
        // Add cast to minting queue
        console.log('Adding cast to minting queue:', parentHash);
        
        const queueData = {
          castHash: payload.data.hash,
          parentHash: payload.data.parent_hash,
          text: payload.data.text,
          author: payload.data.author,
          parentAuthor: payload.data.parent_author,
          timestamp: payload.data.timestamp
        };
        
        await enqueueCast(queueData);
        console.log('Successfully queued cast for minting');
        
        return new NextResponse(JSON.stringify({ success: true, message: 'Cast queued for minting' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error processing mint command:', error);
        console.error('Error details:', {
          text: payload.data.text,
          hash: payload.data.hash,
          parentHash: payload.data.parent_hash,
          error: error instanceof Error ? error.stack : String(error)
        });
        return new NextResponse(JSON.stringify({ error: 'Failed to process mint command' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in webhook:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Error processing webhook' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
