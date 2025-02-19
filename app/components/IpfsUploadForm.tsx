/**
 * IpfsUploadForm Component
 * 
 * A form component for uploading files directly to IPFS via Pinata.
 * Supports any file type up to 2GB in size. Files are pinned to
 * ensure persistence on the IPFS network.
 */

'use client'

import { useState, useRef } from 'react'
import { Result } from '../types'
import { api } from '../lib/api'

export default function IpfsUploadForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handles form submission for IPFS upload
   * 1. Validates file selection
   * 2. Uploads file to IPFS via the API
   * 3. Displays the IPFS URL on success
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setResult({
        success: false,
        error: 'Please select a file'
      })
      setIsLoading(false)
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const data = await api.uploadToIpfs(formData)
      setResult({
        success: true,
        ipfs: {
          url: data.url
        }
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setUploading(false)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 sm:mb-8">Upload to IPFS</h1>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">File</label>
          <input
            type="file"
            ref={fileInputRef}
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 text-sm sm:text-base"
          />
          <p className="text-sm text-gray-400 mt-1">
            Select any file to upload to IPFS (max 2GB)
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || uploading}
          className="w-full bg-black text-white py-2 sm:py-3 px-4 rounded border border-black hover:bg-transparent hover:text-white disabled:bg-gray-800 disabled:border-gray-800 disabled:text-gray-500 text-sm sm:text-base"
        >
          {isLoading || uploading ? 'Uploading...' : 'Upload to IPFS'}
        </button>
      </form>

      {result && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 border rounded bg-transparent">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">
            {result.success ? 'Success!' : 'Error'}
          </h2>
          {result.success ? (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">File Uploaded to IPFS</h3>
              <p className="text-gray-300">
                <strong>IPFS URL:</strong>{' '}
                <a
                  href={result.ipfs?.url.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-400 break-all"
                >
                  {result.ipfs?.url}
                </a>
              </p>
            </div>
          ) : (
            <p className="text-red-400">{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
