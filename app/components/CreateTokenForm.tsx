/**
 * CreateTokenForm Component
 * 
 * A form component for creating new tokens with revenue sharing configuration.
 * Creates a token in an existing NFT contract and sets up split revenue
 * distribution between caster (50%), minter (5%), and platform (45%).
 */

'use client'

import { useState, useRef } from 'react'
import { Result } from '../types'
import { api } from '../lib/api'

export default function CreateTokenForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [walletAddresses, setWalletAddresses] = useState<{
    casterWallet: string;
    minterWallet: string;
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFileToIpfs = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const data = await api.uploadToIpfs(formData)
    return data.url
  }

  const uploadJsonToIpfs = async (json: object): Promise<string> => {
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' })
    const data = await api.uploadToIpfs(blob)
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const file = fileInputRef.current?.files?.[0]
    
    if (!file) {
      setResult({
        success: false,
        error: 'Please select an image file'
      })
      setIsLoading(false)
      return
    }

    try {
      setUploading(true)
      // Upload image to IPFS
      const imageUri = await uploadFileToIpfs(file)
      
      // Create and upload metadata
      const metadata = {
        name: formData.get('title'),
        description: formData.get('description'),
        image: imageUri,
      }
      const metadataUri = await uploadJsonToIpfs(metadata)

      setUploading(false)

      // Get form values with type safety
      const casterWallet = formData.get('casterWallet')
      const minterWallet = formData.get('minterWallet')
      const contractAddress = formData.get('contractAddress')

      if (!casterWallet || !minterWallet || !contractAddress || 
          typeof casterWallet !== 'string' || 
          typeof minterWallet !== 'string' || 
          typeof contractAddress !== 'string') {
        throw new Error('Invalid form data')
      }

      // 1. Create split contract
      const splitData = await api.createSplit({
        casterWallet,
        minterWallet,
      })

      if (!splitData.success || !splitData.split?.address) {
        throw new Error(splitData.error || 'Failed to create split contract')
      }

      // 2. Create token with split address
      const tokenData = await api.createToken({
        contractAddress,
        tokenUri: metadataUri,
        splitAddress: splitData.split.address,
      })

      if (!tokenData.success) {
        throw new Error(tokenData.error || 'Failed to create token')
      }

      // Store wallet addresses and set result
      setWalletAddresses({
        casterWallet,
        minterWallet,
      })
      setResult({
        success: true,
        split: splitData.split,
        token: tokenData.token,
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 sm:mb-8">Create Token with Split Revenue</h1>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Contract Address</label>
          <input
            type="text"
            name="contractAddress"
            placeholder="0x..."
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 placeholder-gray-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Token Image</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 text-sm sm:text-base"
          />
          <p className="text-sm text-gray-400 mt-1">
            Select an image file for your token (max 2GB)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
          <input
            type="text"
            name="title"
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            name="description"
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 text-sm sm:text-base"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Caster Wallet Address</label>
          <input
            type="text"
            name="casterWallet"
            placeholder="0x..."
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 placeholder-gray-500 text-sm sm:text-base"
          />
          <p className="text-sm text-gray-400 mt-1">
            Will receive 50% of royalties
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Minter Wallet Address</label>
          <input
            type="text"
            name="minterWallet"
            placeholder="0x..."
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 placeholder-gray-500 text-sm sm:text-base"
          />
          <p className="text-sm text-gray-400 mt-1">
            Will receive 5% of royalties
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || uploading}
          className="w-full bg-black text-white py-2 sm:py-3 px-4 rounded border border-black hover:bg-transparent hover:text-white disabled:bg-gray-800 disabled:border-gray-800 disabled:text-gray-500 text-sm sm:text-base"
        >
          {isLoading || uploading ? 'Creating...' : 'Create Token'}
        </button>
      </form>

      {result && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 border rounded bg-transparent">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">
            {result.success ? 'Success!' : 'Error'}
          </h2>
          {result.success ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Split Contract</h3>
                <p className="text-gray-300">
                  <strong>Address:</strong> {result.split?.address}
                </p>
                {result.split?.transactionHash && (
                  <p className="text-gray-300">
                    <strong>Transaction:</strong>{' '}
                    <a
                      href={`https://basescan.org/tx/${result.split?.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-gray-400"
                    >
                      View on Basescan ↗
                    </a>
                  </p>
                )}
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Token</h3>
                <p className="text-gray-300">
                  <strong>Creation Transaction:</strong>{' '}
                  <a
                    href={`https://basescan.org/tx/${result.token?.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-gray-400"
                  >
                    View on Basescan ↗
                  </a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Revenue Split</h3>
                <p className="text-gray-300">
                  <strong>Caster (50%):</strong>{' '}
                  <span className="font-mono">{walletAddresses?.casterWallet}</span>
                </p>
                <p className="text-gray-300">
                  <strong>Minter (5%):</strong>{' '}
                  <span className="font-mono">{walletAddresses?.minterWallet}</span>
                </p>
                <p className="text-gray-300">
                  <strong>Platform (45%):</strong>{' '}
                  <span className="font-mono">0x9e1C8368d6773183e2E0b521e73a49D094D25818</span>
                </p>
              </div>
            </>
          ) : (
            <p className="text-red-400">{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
