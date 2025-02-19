import React from 'react';
import { CastEmbed } from '../types';
import { DIMENSIONS, STYLES } from '../config/constants';
import { ImageEmbed } from './ImageEmbed';

interface QuotedCastProps {
  embed: CastEmbed;
}

export function QuotedCast({ embed }: QuotedCastProps) {
  if (!embed?.cast) {
    return null;
  }

  const { cast } = embed;
  const imageEmbed = cast.embeds.find(embed => 
    embed?.metadata?.content_type?.startsWith('image/')
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      border: `1px solid ${STYLES.COLORS.BORDER}`,
      borderRadius: '16px',
      width: `${DIMENSIONS.WIDTH - (DIMENSIONS.PADDING * 2)}px`,
      backgroundColor: STYLES.COLORS.BACKGROUND,
      marginTop: `${DIMENSIONS.IMAGE.MARGIN}px`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
      }}>
        <img
          src={cast.author.pfp_url}
          width={DIMENSIONS.QUOTE.AUTHOR_HEIGHT}
          height={DIMENSIONS.QUOTE.AUTHOR_HEIGHT}
          alt={`${cast.author.display_name}'s profile picture`}
          style={{
            borderRadius: `${DIMENSIONS.QUOTE.AUTHOR_HEIGHT / 2}px`,
          }}
        />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div style={{
            display: 'flex',
            fontFamily: STYLES.FONTS.FAMILY,
            fontSize: STYLES.FONTS.SIZES.MEDIUM,
            fontWeight: 'bold',
            color: STYLES.COLORS.PRIMARY,
          }}>
            {cast.author.display_name}
          </div>
          <div style={{
            display: 'flex',
            fontFamily: STYLES.FONTS.FAMILY,
            fontSize: STYLES.FONTS.SIZES.SMALL,
            color: STYLES.COLORS.SECONDARY,
          }}>
            @{cast.author.username}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {cast.text.split('\n').map((line, index) => (
          line.trim() && (
            <div key={index} style={{
              fontFamily: STYLES.FONTS.FAMILY,
              fontSize: STYLES.FONTS.SIZES.MEDIUM,
              lineHeight: '1.5',
              color: STYLES.COLORS.PRIMARY,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              width: `${DIMENSIONS.WIDTH - (DIMENSIONS.PADDING * 4)}px`, // Account for quote padding
            }}>
              {line}
            </div>
          )
        ))}
      </div>

      {imageEmbed && (
        <ImageEmbed 
          embed={imageEmbed} 
          maxWidth={DIMENSIONS.WIDTH - (DIMENSIONS.PADDING * 4)} // Account for quote padding
          maxHeight={DIMENSIONS.QUOTE.MAX_IMAGE_HEIGHT}
        />
      )}
    </div>
  );
}
