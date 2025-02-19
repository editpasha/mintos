/**
 * CreateImage Component
 * 
 * A form component that creates and uploads Farcaster cast images to IPFS.
 * Features:
 * - Input field for cast hash
 * - Image generation and IPFS upload
 * - IPFS URL display and copy functionality
 * - Example casts for testing
 * - Error handling and loading states
 */

import React, { useState } from 'react';
import ExampleCasts from './ExampleCasts';

/**
 * CreateImage Component
 * 
 * @returns React component for creating and uploading Farcaster cast images to IPFS
 */
export default function CreateImage() {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ipfsUrl, setIpfsUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIpfsUrl('');

    try {
      // First, get the image data
      const imageResponse = await fetch('/api/createImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash }),
      });

      if (!imageResponse.ok) {
        const error = await imageResponse.json();
        throw new Error(error.error || 'Failed to create image');
      }

      // Get the image data as a blob
      const imageBlob = await imageResponse.blob();
      
      // Create form data with the image blob
      const formData = new FormData();
      formData.append('file', imageBlob, `cast-${hash}.png`);

      // Upload to IPFS
      const ipfsResponse = await fetch('/api/ipfs', {
        method: 'POST',
        body: formData,
      });

      if (!ipfsResponse.ok) {
        const error = await ipfsResponse.json();
        throw new Error(error.error || 'Failed to upload to IPFS');
      }

      const data = await ipfsResponse.json();
      setIpfsUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 sm:mb-8">Create Cast Image</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label htmlFor="hash" className="block text-sm font-medium text-gray-300 mb-2">
            Cast Hash
          </label>
          <input
            type="text"
            id="hash"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="Enter cast hash..."
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 text-sm sm:text-base"
            required
          />
          <p className="text-sm text-gray-400 mt-1">
            Enter a Farcaster cast hash to create and upload its image to IPFS
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 sm:py-3 px-4 rounded border border-black hover:bg-transparent hover:text-white disabled:bg-gray-800 disabled:border-gray-800 disabled:text-gray-500 text-sm sm:text-base"
        >
          {loading ? 'Creating...' : 'Create Image'}
        </button>
      </form>

      {error && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 border rounded bg-transparent">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Error</h2>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {ipfsUrl && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 border rounded bg-transparent">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">IPFS URL</h2>
          <div className="break-all bg-gray-800 p-4 rounded">
            <a 
              href={ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              {ipfsUrl}
            </a>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigator.clipboard.writeText(ipfsUrl)}
              className="inline-block py-2 sm:py-3 px-4 bg-black text-white rounded border border-black hover:bg-transparent hover:text-white text-sm sm:text-base"
            >
              Copy URL
            </button>
          </div>
        </div>
      )}

      <ExampleCasts onSelect={setHash} />
    </div>
  );
}
