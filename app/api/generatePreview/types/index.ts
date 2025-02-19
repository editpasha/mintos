export interface ImageMetadata {
  width_px: number;
  height_px: number;
}

export interface TweetContent {
  text: string;
  imageUrl?: string;
  author?: string;
}

export interface OEmbed {
  url?: string;
  html?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  author_name?: string;
  title?: string;
}

export interface VideoStream {
  height_px: number;
  width_px: number;
  codec_name: string;
}

interface VideoMetadata {
  streams: VideoStream[];
  duration_s: number;
  thumbnailId?: string;
}

interface EmbedMetadata {
  content_type?: string;
  image?: ImageMetadata;
  html?: {
    oembed?: OEmbed;
  };
  video?: VideoMetadata;
}

export interface CastEmbed {
  url?: string;
  metadata?: EmbedMetadata;
  cast_id?: {
    fid: number;
    hash: string;
  };
  cast?: {
    hash: string;
    author: {
      username: string;
      display_name: string;
      pfp_url: string;
    };
    text: string;
    embeds: CastEmbed[];
  };
}

export interface Author {
  username: string;
  display_name: string;
  pfp_url: string;
}

export interface CastData {
  hash: string;
  thread_hash: string;
  parent_hash: string;
  text: string;
  author: Author;
  embeds: CastEmbed[];
}
