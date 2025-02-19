/**
 * Cast Content Height Calculation Utilities
 * 
 * This module provides utilities for calculating the dynamic height of cast content
 * for image generation. It handles various content types including:
 * - Text content with line wrapping
 * - Image embeds with aspect ratio preservation
 * - Quote casts with nested content
 * - Multi-line text with proper spacing
 */

import { CastData } from '../types';
import { DIMENSIONS } from '../config/constants';

/**
 * Calculates the total height needed to display a cast's content
 * 
 * The calculation considers:
 * - Profile section height (80px)
 * - Text content with line wrapping (based on 65 chars per line)
 * - Image embeds with aspect ratio scaling
 * - Quote casts with nested content
 * - Margins and padding between elements
 * 
 * @param cast - The cast data containing text, embeds, and metadata
 * @returns The total height in pixels needed for the cast content
 */
export function calculateContentHeight(cast: CastData): number {
  const imageEmbed = cast.embeds.find(embed => embed?.metadata?.content_type?.startsWith('image/')) || undefined;
  const quoteCast = cast.embeds.find(embed => embed?.cast)?.cast || undefined;
  
  // Fixed heights
  const profileHeight = DIMENSIONS.PROFILE_HEIGHT;
  const profileMargin = DIMENSIONS.PROFILE_MARGIN;
  const padding = DIMENSIONS.PADDING;
  
  // Calculate text height
  const textLines = cast.text.split('\n').filter(line => line.trim());
  let textHeight = 0;
  
  textLines.forEach(line => {
    const charsPerLine = DIMENSIONS.TEXT.CHARS_PER_LINE;
    const lines = Math.ceil(line.length / charsPerLine);
    textHeight += lines * DIMENSIONS.TEXT.LINE_HEIGHT;
  });
  
  // Add height for line gaps
  if (textLines.length > 1) {
    textHeight += (textLines.length - 1) * DIMENSIONS.TEXT.GAP;
  }
  
  // Calculate embed heights
  let embedHeight = 0;
  let embedMargin = 0;

  // Add quote cast height if present
  if (quoteCast) {
    const quoteLines = quoteCast.text.split('\n').filter(line => line.trim());
    let quoteTextHeight = 0;
    
    quoteLines.forEach(line => {
      const quoteCharsPerLine = DIMENSIONS.QUOTE.CHARS_PER_LINE;
      const lines = Math.ceil(line.length / quoteCharsPerLine);
      quoteTextHeight += lines * DIMENSIONS.QUOTE.LINE_HEIGHT;
    });
    
    // Add height for line gaps
    if (quoteLines.length > 1) {
      quoteTextHeight += (quoteLines.length - 1) * DIMENSIONS.QUOTE.GAP;
    }
    
    const quoteHeight = DIMENSIONS.QUOTE.PADDING + 
                       DIMENSIONS.QUOTE.AUTHOR_HEIGHT +
                       DIMENSIONS.QUOTE.AUTHOR_GAP +
                       quoteTextHeight;
    
    // Calculate quote height with content and padding
    embedHeight = quoteHeight;
    
    // Add quote image height if present
    if (quoteCast.embeds[0]?.metadata?.image) {
      const quoteImageWidth = DIMENSIONS.WIDTH - (DIMENSIONS.PADDING * 4);
      const quoteImageScaleFactor = quoteImageWidth / quoteCast.embeds[0].metadata.image.width_px;
      const quoteImageHeight = Math.min(
        quoteCast.embeds[0].metadata.image.height_px * quoteImageScaleFactor,
        DIMENSIONS.QUOTE.MAX_IMAGE_HEIGHT
      );
      embedHeight += quoteImageHeight;
    }
    
    // Add main image height if present
    if (imageEmbed?.metadata?.image) {
      const mainImageWidth = DIMENSIONS.WIDTH - (DIMENSIONS.PADDING * 2);
      const mainScaleFactor = mainImageWidth / imageEmbed.metadata.image.width_px;
      const mainImageHeight = Math.min(imageEmbed.metadata.image.height_px * mainScaleFactor, DIMENSIONS.IMAGE.MAX_HEIGHT);
      embedHeight += mainImageHeight;
    }
    
    // Add margin for spacing
    embedMargin = DIMENSIONS.IMAGE.MARGIN;
  } else if (imageEmbed?.metadata?.image) {
    const mainImageWidth = DIMENSIONS.WIDTH - (DIMENSIONS.PADDING * 2);
    const scaleFactor = mainImageWidth / imageEmbed.metadata.image.width_px;
    embedHeight = Math.min(imageEmbed.metadata.image.height_px * scaleFactor, DIMENSIONS.IMAGE.MAX_HEIGHT);
    embedMargin = DIMENSIONS.IMAGE.MARGIN;
  }
  
  return profileHeight + profileMargin + textHeight + embedHeight + embedMargin + padding;
}
