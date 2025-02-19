'use client'

/**
 * Home Page Component
 * 
 * Environment-based routing:
 * - Production: Shows a landing page explaining the platform's minting commands and benefits
 * - Development: Provides access to various NFT and token management functionalities
 * 
 * Features:
 * - Conditional rendering based on NEXT_PUBLIC_NODE_ENV
 * - Development tools:
 *   - Contract creation
 *   - Token management with splits
 *   - IPFS uploads
 *   - Cast preview generation
 *   - Cast image creation
 * - Tab-based navigation between tools
 * 
 */

import { useState } from 'react'
import Landing from './components/Landing'
import CreateContractForm from './components/CreateContractForm'
import CreateTokenForm from './components/CreateTokenForm'
import IpfsUploadForm from './components/IpfsUploadForm'
import CreateSplitForm from './components/CreateSplitForm'
import GeneratePreview from './components/GeneratePreview'
import CreateImage from './components/CreateImage'

/**
 * Home Component
 * 
 * Conditionally renders either the landing page or development tools
 * based on the current environment.
 */
export default function Home() {
  // State to track which form is currently active
  const [activeForm, setActiveForm] = useState<'create' | 'createToken' | 'ipfs' | 'split' | 'preview' | 'createImage'>('create')
  
  // Show landing page in production
  if (process.env.NEXT_PUBLIC_NODE_ENV === 'production') {
    return <Landing />
  }


  return (
    <main className="min-h-screen p-3 sm:p-8 mx-auto max-w-7xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-4 mb-8">
        <button
          onClick={() => setActiveForm('create')}
          className={`w-full px-3 sm:px-4 py-2.5 rounded border text-sm font-medium transition-colors ${
            activeForm === 'create'
              ? 'bg-black text-white border-black'
              : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:bg-black/5'
          }`}
        >
          New Contract
        </button>
        <button
          onClick={() => setActiveForm('createToken')}
          className={`w-full px-3 sm:px-4 py-2.5 rounded border text-sm font-medium transition-colors ${
            activeForm === 'createToken'
              ? 'bg-black text-white border-black'
              : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:bg-black/5'
          }`}
        >
          Token + Split
        </button>
        <button
          onClick={() => setActiveForm('ipfs')}
          className={`w-full px-3 sm:px-4 py-2.5 rounded border text-sm font-medium transition-colors ${
            activeForm === 'ipfs'
              ? 'bg-black text-white border-black'
              : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:bg-black/5'
          }`}
        >
          IPFS Upload
        </button>
        <button
          onClick={() => setActiveForm('split')}
          className={`w-full px-3 sm:px-4 py-2.5 rounded border text-sm font-medium transition-colors ${
            activeForm === 'split'
              ? 'bg-black text-white border-black'
              : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:bg-black/5'
          }`}
        >
          Split Wallet
        </button>
        <button
          onClick={() => setActiveForm('preview')}
          className={`w-full px-3 sm:px-4 py-2.5 rounded border text-sm font-medium transition-colors ${
            activeForm === 'preview'
              ? 'bg-black text-white border-black'
              : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:bg-black/5'
          }`}
        >
          Cast Preview
        </button>
        <button
          onClick={() => setActiveForm('createImage')}
          className={`w-full px-3 sm:px-4 py-2.5 rounded border text-sm font-medium transition-colors ${
            activeForm === 'createImage'
              ? 'bg-black text-white border-black'
              : 'bg-transparent text-gray-400 border-gray-700 hover:text-white hover:bg-black/5'
          }`}
        >
          Create Cast Image
        </button>
      </div>

      {activeForm === 'create' && <CreateContractForm />}
      {activeForm === 'createToken' && <CreateTokenForm />}
      {activeForm === 'ipfs' && <IpfsUploadForm />}
      {activeForm === 'split' && <CreateSplitForm />}
      {activeForm === 'preview' && <GeneratePreview />}
      {activeForm === 'createImage' && <CreateImage />}
    </main>
  )
}
