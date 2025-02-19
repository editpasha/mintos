import { TweetContent } from '../types';

export function extractTweetContent(html: string): TweetContent {
  // Extract tweet text
  const textMatch = html.match(/<p.*?>(.*?)<\/p>/);
  const text = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&') : '';
  
  // Extract image URL
  const imageMatch = html.match(/pic\.twitter\.com\/(\w+)/);
  const imageUrl = imageMatch ? `https://pbs.twimg.com/media/${imageMatch[1]}?format=jpg&name=medium` : undefined;
  
  // Extract author
  const authorMatch = html.match(/mdash; (.*?) \(/);
  const author = authorMatch ? authorMatch[1] : undefined;
  
  return { text, imageUrl, author };
}
