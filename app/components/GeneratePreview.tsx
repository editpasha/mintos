/**
 * GeneratePreview Component
 * 
 * A form component that generates preview images for Farcaster casts.
 * Features:
 * - Input field for cast hash
 * - Preview image generation
 * - Image download functionality
 * - Example casts for testing
 * - Error handling and loading states
 */

import React, { useState } from 'react';
import ExampleCasts from './ExampleCasts';

/**
 * GeneratePreview Component
 * 
 * @returns React component for generating and displaying Farcaster cast previews
 */
export default function GeneratePreview() {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPreviewUrl('');

    try {
      const response = await fetch('/api/generatePreview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'image/png',
        },
        body: JSON.stringify({ hash }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate preview');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 sm:mb-8">Generate Cast Preview</h1>
      
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
            Enter a Farcaster cast hash to generate its preview image
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 sm:py-3 px-4 rounded border border-black hover:bg-transparent hover:text-white disabled:bg-gray-800 disabled:border-gray-800 disabled:text-gray-500 text-sm sm:text-base"
        >
          {loading ? 'Generating...' : 'Generate Preview'}
        </button>
      </form>

      {error && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 border rounded bg-transparent">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Error</h2>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {previewUrl && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 border rounded bg-transparent">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Preview</h2>
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <img src={previewUrl} alt="Cast preview" className="w-full" />
          </div>
          <div className="mt-4">
            <a 
              href={previewUrl}
              download={`cast-${hash}.png`}
              className="inline-block py-2 sm:py-3 px-4 bg-black text-white rounded border border-black hover:bg-transparent hover:text-white text-sm sm:text-base"
            >
              Download Image
            </a>
          </div>
        </div>
      )}

      <ExampleCasts onSelect={setHash} />
    </div>
  );
}
