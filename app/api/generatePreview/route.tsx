/**
 * Cast Preview Generation API Route
 * 
 * This API endpoint generates preview images for Farcaster casts using @vercel/og.
 * Features:
 * - Generates high-quality social preview images
 * - Supports threaded casts with parent context
 * - Dynamic height calculation based on content
 * - Consistent styling with Farcaster's design
 * - Error handling for invalid requests
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import React from 'react';
import { Cast } from './components/Cast';
import { Footer } from './components/Footer';
import { getCast } from './services/neynar';
import { calculateContentHeight } from './utils/calculations';
import { handleAPIError, APIError } from './utils/error-handler';
import { DIMENSIONS, STYLES } from './config/constants';

// Use edge runtime for optimal performance with @vercel/og
export const runtime = 'edge';

/**
 * POST endpoint for generating cast preview images
 * 
 * @param request - Next.js request object containing cast hash
 * @returns ImageResponse with the generated preview
 * @throws APIError for invalid requests or failed operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.hash) {
      throw new APIError('Cast hash is required', 400, 'VALIDATION_ERROR');
    }

    // Fetch main cast
    const cast = await getCast(body.hash);

    // Fetch parent cast if it's part of a thread
    const parentCast = cast.parent_hash && cast.parent_hash === cast.thread_hash
      ? await getCast(cast.parent_hash)
      : null;

    // Calculate heights
    const mainHeight = calculateContentHeight(cast);
    const parentHeight = parentCast ? calculateContentHeight(parentCast) : 0;
    const totalHeight = mainHeight + parentHeight + DIMENSIONS.FOOTER_HEIGHT;

    // Generate image response
    return new ImageResponse(
      (
        <div style={{
          width: `${DIMENSIONS.WIDTH}px`,
          height: totalHeight,
          backgroundColor: STYLES.COLORS.BACKGROUND,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Content Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            position: 'relative',
            marginBottom: `${DIMENSIONS.PADDING * 2}px`,
          }}>
            {parentCast && <Cast cast={parentCast} offsetY={0} />}
            <Cast 
              cast={cast} 
              offsetY={parentCast ? calculateContentHeight(parentCast) : 0} 
            />
          </div>
          
          <Footer />
        </div>
      ),
      {
        width: DIMENSIONS.WIDTH,
        height: totalHeight,
      }
    );

  } catch (error) {
    return handleAPIError(error);
  }
}
