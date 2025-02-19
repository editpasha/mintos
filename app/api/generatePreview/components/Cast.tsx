import React from 'react';
import { CastData } from '../types';
import { DIMENSIONS, STYLES } from '../config/constants';
import { Profile } from './Profile';
import { ImageEmbed } from './ImageEmbed';
import { QuotedCast } from './QuotedCast';

interface CastProps {
  cast: CastData;
  offsetY?: number;
}

export function Cast({ cast, offsetY = 0 }: CastProps) {
  const imageEmbed = cast.embeds.find(embed => 
    embed?.metadata?.content_type?.startsWith('image/')
  );
  const quoteCast = cast.embeds.find(embed => embed?.cast);
  const isReply = cast.parent_hash && cast.parent_hash !== cast.thread_hash;
  
  return (
    <div style={{
      position: 'absolute',
      top: offsetY,
      left: 0,
      width: '100%',
      padding: `${DIMENSIONS.PADDING}px`,
      backgroundColor: STYLES.COLORS.BACKGROUND,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Reply Line */}
      {isReply && (
        <div style={{
          position: 'absolute',
          left: '64px',
          top: '-16px',
          width: '2px',
          height: '40px',
          backgroundColor: STYLES.COLORS.BORDER,
        }} />
      )}
      
      {/* Profile Section */}
      <Profile author={cast.author} />

      {/* Text Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: quoteCast || imageEmbed ? `${DIMENSIONS.IMAGE.MARGIN}px` : '0',
      }}>
        {cast.text.split('\n').map((line, index, array) => (
          line.trim() && (
            <div key={index} style={{
              fontFamily: STYLES.FONTS.FAMILY,
              fontSize: STYLES.FONTS.SIZES.LARGE,
              lineHeight: '1.5',
              width: `${DIMENSIONS.WIDTH - (DIMENSIONS.PADDING * 2)}px`,
              marginBottom: index < array.length - 1 ? '8px' : '0',
            }}>
              {line}
            </div>
          )
        ))}
      </div>

      {/* Image Embed */}
      {imageEmbed && <ImageEmbed embed={imageEmbed} />}

      {/* Quote Cast */}
      {quoteCast && <QuotedCast embed={quoteCast} />}
    </div>
  );
}
