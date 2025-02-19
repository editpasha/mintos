/**
 * ExampleCasts Component
 * 
 * A component that displays a list of example Farcaster casts for testing purposes.
 * Provides a clickable interface to select different types of casts (with images,
 * videos, quotes, frames, etc.) for preview generation or image creation.
 */

import React from 'react';

/**
 * Interface representing an example cast with its description and hash
 */
interface ExampleCast {
  description: string;
  hash: string;
}

const exampleCasts: ExampleCast[] = [
  {
    description: "Cast with image",
    hash: "0x96ff87b145d46546bf4215c25eda0d4cd948181e"
  },
  {
    description: "Cast with quote cast and frame v2",
    hash: "0xd9ece8d0edca987e073a876e716581931d86c61e"
  },
  {
    description: "Cast with frame v1",
    hash: "0xa1ced0e8d3eb05280662056300e7e428a0051d04"
  },
  {
    description: "Cast with video",
    hash: "0x2b9ad4b58ba11736e11ad73a19d5da78c9bcd242"
  },
  {
    description: "Quote cast",
    hash: "0x0384063b64604e2a804b2e3d507a2caf504eca99"
  },
  {
    description: "Quote cast with image",
    hash: "0xc259c616bb02b962832043cea8cc659cf78779b2"
  }
];

/**
 * ExampleCasts Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Callback function that receives the selected cast hash
 * @returns React component displaying a grid of example casts
 */
export default function ExampleCasts({ onSelect }: { onSelect: (hash: string) => void }) {
  return (
    <div className="mt-8 p-4 border rounded bg-transparent">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Example Casts</h2>
      <div className="grid gap-3">
        {exampleCasts.map((cast, index) => (
          <div
            key={index}
            onClick={() => onSelect(cast.hash)}
            className="p-3 border border-gray-700 rounded cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <div className="text-sm text-gray-400 mb-1">
              {cast.description}
            </div>
            <code className="text-sm text-gray-300 font-mono break-all">
              {cast.hash}
            </code>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-3">
        Click on any cast to use its hash
      </p>
    </div>
  );
}
