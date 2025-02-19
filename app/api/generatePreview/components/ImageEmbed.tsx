import React from 'react';
import { CastEmbed } from '../types';
import { DIMENSIONS } from '../config/constants';

interface ImageEmbedProps {
  embed: CastEmbed;
  maxWidth?: number;
  maxHeight?: number;
}

export function ImageEmbed({ 
  embed, 
  maxWidth = DIMENSIONS.WIDTH - (DIMENSIONS.PADDING * 2), // Default to full width minus padding
  maxHeight = DIMENSIONS.IMAGE.MAX_HEIGHT 
}: ImageEmbedProps) {
  if (!embed?.url || !embed.metadata?.image) {
    return null;
  }

  const { width_px, height_px } = embed.metadata.image;
  const scaleFactor = maxWidth / width_px;
  const scaledHeight = Math.min(height_px * scaleFactor, maxHeight);

  return (
    <div style={{
      display: 'flex',
      width: `${maxWidth}px`,
      height: `${scaledHeight}px`,
      marginTop: embed.metadata.content_type?.startsWith('image/') ? 
        `${DIMENSIONS.IMAGE.MARGIN}px` : '0',
    }}>
      <img
        src={embed.url}
        width={maxWidth}
        height={scaledHeight}
        alt="Embedded cast image"
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
