/**
 * API Route: IPFS Upload
 * 
 * Handles file uploads to IPFS through Pinata's service.
 * Supports both file uploads (via FormData) and JSON uploads.
 * Files are pinned to ensure persistence on the IPFS network.
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadToIPFS } from '../../lib/ipfs'

export const runtime = 'nodejs'

/**
 * POST handler for file uploads
 * 
 * Handles two types of uploads:
 * 1. File uploads through multipart/form-data
 * 2. JSON data through application/json
 * 
 * Size limit is 2GB for all uploads.
 * 
 * @param request - HTTP request containing file or JSON data
 * @returns Response with IPFS URL of the uploaded content
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let buffer: Buffer
    let filename: string

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
      }

      // Convert File to Buffer
      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
      filename = file.name
    } else if (contentType.includes('application/json')) {
      // Handle JSON upload
      const json = await request.json()
      
      // Validate JSON
      try {
        const jsonString = JSON.stringify(json)
        JSON.parse(jsonString) // Will throw if invalid JSON
        buffer = Buffer.from(jsonString)
        filename = 'metadata.json'
      } catch {
        return NextResponse.json({ error: 'Invalid JSON data.' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type.' }, { status: 400 })
    }

    // Check file size (2GB limit)
    const maxSize = 2000 * 1024 * 1024 // 2GB in bytes
    if (buffer.length > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 2GB limit.' }, { status: 400 })
    }

    const ipfsUrl = await uploadToIPFS(buffer, filename)

    return NextResponse.json({ url: ipfsUrl }, { status: 200 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file to IPFS.' }, { status: 500 })
  }
}
