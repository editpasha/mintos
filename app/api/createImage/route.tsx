/**
 * Cast Image Creation and IPFS Upload API Route
 * 
 * This API endpoint generates images for Farcaster casts and uploads them to IPFS.
 * Features:
 * - Generates high-quality cast images using @vercel/og
 * - Supports threaded casts with parent context
 * - Dynamic height calculation based on content
 * - Direct IPFS upload via Pinata SDK
 * - Error handling for invalid requests and failed operations
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import React from 'react';
import { uploadToIPFS } from '../../lib/ipfs';
import { Cast } from '../generatePreview/components/Cast';
import { Footer } from '../generatePreview/components/Footer';
import { getCast } from '../generatePreview/services/neynar';
import { calculateContentHeight } from '../generatePreview/utils/calculations';
import { handleAPIError, APIError } from '../generatePreview/utils/error-handler';
import { DIMENSIONS, STYLES } from '../generatePreview/config/constants';

// Use edge runtime for @vercel/og compatibility
export const runtime = 'edge';

// Use Inter font for consistent rendering
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

const fontFamily = inter.style.fontFamily;

/**
 * POST endpoint for creating cast images and uploading to IPFS
 * 
 * Process:
 * 1. Generates cast image using @vercel/og
 * 2. Converts image to Buffer
 * 3. Uploads directly to IPFS via Pinata SDK
 * 4. Returns IPFS URL of the uploaded image
 * 
 * @param request - Next.js request object containing cast hash
 * @returns JSON response with IPFS URL of the generated image
 * @throws APIError for invalid requests or failed operations
 */
export async function POST(request: NextRequest) {
  // Declare cast variable in outer scope
  let cast: Awaited<ReturnType<typeof getCast>> | null = null;

  try {
    console.log('Creating image for cast - Request received');
    const body = await request.json();
    console.log('Request body:', body);

    if (!body.hash) {
      console.error('Validation error: Cast hash is missing');
      throw new APIError('Cast hash is required', 400, 'VALIDATION_ERROR');
    }

    console.log('Fetching cast data for hash:', body.hash);
    // Fetch main cast
    cast = await getCast(body.hash);

    console.log('Main cast data:', JSON.stringify(cast, null, 2));

    // Fetch parent cast if it's part of a thread
    let parentCast = null;
    if (cast.parent_hash && cast.parent_hash === cast.thread_hash) {
      console.log('Fetching parent cast:', cast.parent_hash);
      parentCast = await getCast(cast.parent_hash);
      console.log('Parent cast data:', JSON.stringify(parentCast, null, 2));
    }

    console.log('Calculating content heights');
    // Calculate heights
    const mainHeight = calculateContentHeight(cast);
    const parentHeight = parentCast ? calculateContentHeight(parentCast) : 0;
    const totalHeight = mainHeight + parentHeight + DIMENSIONS.FOOTER_HEIGHT;

    console.log('Generating image with dimensions:', {
      width: DIMENSIONS.WIDTH,
      height: totalHeight,
      mainHeight,
      parentHeight
    });
    console.log('Preparing to generate image with fonts:', {
      fontFamily,
      interConfig: inter
    });

    // Generate image with enhanced error handling
    let imageResponse;
    try {
      imageResponse = new ImageResponse(
        (
          <div
            style={{
              width: `${DIMENSIONS.WIDTH}px`,
              height: `${totalHeight}px`,
              backgroundColor: STYLES.COLORS.BACKGROUND,
              fontFamily,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Content Container */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                height: `${totalHeight - DIMENSIONS.FOOTER_HEIGHT}px`,
                flex: 1,
              }}
            >
              {parentCast && <Cast cast={parentCast} offsetY={0} />}
              <Cast 
                cast={cast} 
                offsetY={parentCast ? calculateContentHeight(parentCast) : 0} 
              />
            </div>
            
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${DIMENSIONS.FOOTER_HEIGHT}px`,
              }}
            >
              <Footer />
            </div>
          </div>
        ),
        {
          width: DIMENSIONS.WIDTH,
          height: totalHeight
        }
      );
    } catch (error) {
      console.error('Failed to generate image:', error);
      throw new APIError(
        `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'IMAGE_GENERATION_ERROR'
      );
    }

    console.log('Image generated successfully, converting to array buffer');
    // Get image data with enhanced error handling
    let arrayBuffer;
    try {
      arrayBuffer = await imageResponse.arrayBuffer();
      console.log('Array buffer size:', arrayBuffer.byteLength);
    } catch (error) {
      console.error('Failed to get array buffer:', error);
      throw new APIError(
        `Failed to process image data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'IMAGE_PROCESSING_ERROR'
      );
    }

    // Upload image to IPFS
    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadToIPFS(buffer, `cast-${body.hash}.png`);

    // Return JSON response with image URL
    return Response.json({ url });
  } catch (error) {
    // Log detailed error information
    console.error('Error in createImage:', {
      error: error instanceof Error ? error.stack : error,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof APIError ? 'APIError' : error instanceof Error ? error.constructor.name : typeof error,
      cast: cast ? {
        hasText: !!cast.text,
        hasAuthor: !!cast.author,
        authorPfp: cast.author?.pfp_url ? 'present' : 'missing',
        embedsCount: cast.embeds?.length,
        parentHash: cast.parent_hash,
        threadHash: cast.thread_hash
      } : 'No cast data'
    });

    // Convert non-APIErrors to APIErrors with appropriate status codes
    if (!(error instanceof APIError)) {
      error = new APIError(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        'IMAGE_GENERATION_ERROR'
      );
    }

    return handleAPIError(error);
  }
}
