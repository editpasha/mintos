import { CastData } from '../types';

export async function getVideoThumbnail(cast: CastData): Promise<string | undefined> {
  try {
    // Get the video embed
    const videoEmbed = cast.embeds.find(embed => embed?.metadata?.content_type === 'application/x-mpegurl');
    if (!videoEmbed?.metadata?.video) {
      console.log('No video metadata found in cast');
      return undefined;
    }

    // Check if we have a thumbnailId in the metadata
    if (videoEmbed.metadata.video.thumbnailId) {
      const thumbnailUrl = `https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/${videoEmbed.metadata.video.thumbnailId}/original`;
      console.log('Using thumbnail URL from metadata:', thumbnailUrl);
      return thumbnailUrl;
    }

    // Fallback: Try to construct URL from video ID
    if (videoEmbed.url) {
      const videoId = videoEmbed.url.split('/').pop()?.split('.')[0];
      if (videoId) {
        const fallbackUrl = `https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/${videoId}/original`;
        console.log('Using fallback thumbnail URL:', fallbackUrl);
        return fallbackUrl;
      }
    }

    console.log('No video thumbnail found');
    return undefined;
  } catch (error) {
    console.error('Error getting video thumbnail:', error);
    return undefined;
  }
}
