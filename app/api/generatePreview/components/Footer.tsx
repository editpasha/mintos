import React from 'react';
import { DIMENSIONS, STYLES } from '../config/constants';

export function Footer() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: `${DIMENSIONS.FOOTER_HEIGHT / 2}px`,
      padding: `0 ${DIMENSIONS.PADDING}px`,
    }}>
      <hr style={{
        width: '100%',
        height: '1px',
        backgroundColor: STYLES.COLORS.BORDER,
        border: 'none',
        margin: '0 0 12px 0',
      }} />
      <span style={{
        fontFamily: STYLES.FONTS.FAMILY,
        fontSize: STYLES.FONTS.SIZES.SMALL,
        color: STYLES.COLORS.SECONDARY,
        textAlign: 'right',
      }}>
        www.mintos.xyz
      </span>
    </div>
  );
}
