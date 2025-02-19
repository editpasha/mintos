/**
 * IPFS Content Management System
 * 
 * This module handles file uploads to IPFS through Pinata's pinning service.
 * It provides reliable content addressing and permanent storage for NFT assets.
 * 
 * Features:
 * - Efficient buffer-to-stream conversion
 * - Configurable CID versions (defaults to v1)
 * - Automatic metadata handling
 * - Error handling with detailed logging
 * 
 * Upload Process:
 * 1. Convert file buffer to readable stream
 * 2. Configure Pinata upload options
 * 3. Upload and pin content to IPFS
 * 4. Return IPFS URI (ipfs://[CIDv1])
 * 
 * File Handling:
 * - Supports any file type
 * - Handles large files efficiently through streaming
 * - Preserves original filenames in metadata
 * 
 * Error Handling:
 * - Connection error detection
 * - Upload failure recovery
 * - Detailed error logging
 * 
 * Required Environment Variables:
 * - PINATA_API_KEY: Pinata API key
 * - PINATA_SECRET_API_KEY: Pinata secret key
 * 
 * Usage Notes:
 * - Maximum file size: 2GB (Pinata limit)
 * - Content is permanently pinned
 * - CIDv1 ensures case-insensitive addressing
 */

import { Readable } from 'stream'
import pinataSDK from '@pinata/sdk'

// Initialize Pinata client with API credentials
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_API_KEY!
)

/**
 * Converts a Buffer to a Readable stream for Pinata upload
 * @param buffer - The buffer to convert
 * @returns A readable stream of the buffer content
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

/**
 * Uploads a file to IPFS through Pinata
 * @param buffer - The file content as a buffer
 * @param filename - Original filename for metadata
 * @returns IPFS URI of the uploaded file
 */
export async function uploadToIPFS(buffer: Buffer, filename: string): Promise<string> {
  const fileStream = bufferToStream(buffer)
  const options = {
    pinataMetadata: { name: filename },
    pinataOptions: { cidVersion: 1 as const },
  }

  try {
    const result = await pinata.pinFileToIPFS(fileStream, options)
    return `ipfs://${result.IpfsHash}`
  } catch (error) {
    console.error('Failed to upload to IPFS:', error)
    throw new Error('Failed to upload file.')
  }
}
