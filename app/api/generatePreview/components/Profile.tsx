import React from 'react';
import { Author } from '../types';
import { DIMENSIONS, STYLES } from '../config/constants';

interface ProfileProps {
  author: Author;
}

export function Profile({ author }: ProfileProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: `${DIMENSIONS.PROFILE_HEIGHT}px`,
      marginBottom: `${DIMENSIONS.PROFILE_MARGIN}px`,
    }}>
      <img
        src={author.pfp_url}
        width={DIMENSIONS.PROFILE_HEIGHT}
        height={DIMENSIONS.PROFILE_HEIGHT}
        alt={`${author.display_name}'s profile picture`}
        style={{
          borderRadius: `${DIMENSIONS.PROFILE_HEIGHT / 2}px`,
          marginRight: '16px',
          position: 'relative',
          zIndex: 1,
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
          fontSize: STYLES.FONTS.SIZES.LARGE,
          fontWeight: 'bold',
        }}>
          {author.display_name}
        </div>
        <div style={{
          display: 'flex',
          fontFamily: STYLES.FONTS.FAMILY,
          fontSize: STYLES.FONTS.SIZES.MEDIUM,
          color: STYLES.COLORS.SECONDARY,
        }}>
          @{author.username}
        </div>
      </div>
    </div>
  );
}
