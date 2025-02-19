/**
 * CreateContractForm Component
 * 
 * A form component for creating new NFT contracts using Zora's protocol.
 * Allows users to upload a collection image and set a collection name.
 * The image is uploaded to IPFS and used as the contract's URI.
 */

'use client'

import { useState, useRef } from 'react'
import { Result } from '../types'
import { api } from '../lib/api'

export default function CreateContractForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Uploads a file to IPFS
   * @param file - The file to upload
   * @returns IPFS URL of the uploaded file
   */
  const uploadFileToIpfs = async (file: File): Promise<string> => {
    console.log('Uploading file to IPFS:', { fileName: file.name, fileSize: file.size });
    const formData = new FormData()
    formData.append('file', file)
    const data = await api.uploadToIpfs(formData)
    console.log('File uploaded to IPFS:', { url: data.url });
    return data.url
  }

  /**
   * Uploads JSON metadata to IPFS
   * @param json - The JSON data to upload
   * @returns IPFS URL of the uploaded JSON
   */
  const uploadJsonToIpfs = async (json: object): Promise<string> => {
    console.log('Uploading metadata to IPFS:', json);
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
    formData.append('file', blob);
    const data = await api.uploadToIpfs(formData)
    console.log('Metadata uploaded to IPFS:', { url: data.url });
    return data.url
  }

  /**
   * Handles form submission for contract creation
   * 1. Uploads collection image to IPFS
   * 2. Creates and uploads metadata JSON
   * 3. Creates NFT contract with the URIs
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submission started');
    setIsLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const file = fileInputRef.current?.files?.[0]
    console.log('Form data:', { 
      name: formData.get('name'),
      fileSelected: !!file 
    });
    
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
      console.log('Starting IPFS uploads...');
      // Upload image to IPFS
      const imageUri = await uploadFileToIpfs(file)
      
      // Create and upload metadata
      console.log('Creating metadata...');
      const metadata = {
        name: formData.get('name'),
        description: "Contract metadata",
        image: imageUri,
      }
      const metadataUri = await uploadJsonToIpfs(metadata)

      setUploading(false)
      console.log('Creating contract with params:', {
        name: formData.get('name'),
        uri: imageUri,
        tokenUri: metadataUri,
      });
      const contractData = {
        name: formData.get('name') as string,
        uri: imageUri,
        tokenUri: metadataUri
      };
      
      const response = await api.createContract(contractData);
      console.log('Contract creation response:', response);
      
      if (!response.success || !response.contract) {
        throw new Error('Invalid contract creation response');
      }
      
      setResult(response);
    } catch (error) {
      console.error('Form submission error:', error);
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
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 sm:mb-8">Create NFT Contract</h1>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Collection Image</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 text-sm sm:text-base"
          />
          <p className="text-sm text-gray-400 mt-1">
            Select an image file for your collection (max 2GB)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Collection Name</label>
          <input
            type="text"
            name="name"
            required
            className="w-full p-2 sm:p-3 border rounded bg-transparent text-gray-200 text-sm sm:text-base"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || uploading}
          className="w-full bg-black text-white py-2 sm:py-3 px-4 rounded border border-black hover:bg-transparent hover:text-white disabled:bg-gray-800 disabled:border-gray-800 disabled:text-gray-500 text-sm sm:text-base"
        >
          {isLoading || uploading ? 'Creating...' : 'Create Contract'}
        </button>
      </form>

      {result && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 border rounded bg-transparent">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">
            {result.success ? 'Success!' : 'Error'}
          </h2>
          {result.success ? (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">NFT Contract Created</h3>
              <div className="space-y-2">
                {result.contract?.address && (
                  <p className="text-gray-300">
                    <strong>Contract Address:</strong>{' '}
                    <a
                      href={`https://basescan.org/address/${result.contract.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-gray-400"
                    >
                      {result.contract.address} ↗
                    </a>
                  </p>
                )}
                {result.contract?.transactionHash && (
                  <p className="text-gray-300">
                    <strong>Transaction:</strong>{' '}
                    <a
                      href={`https://basescan.org/tx/${result.contract.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-gray-400"
                    >
                      View on Basescan ↗
                    </a>
                  </p>
                )}
                {result.contract?.factoryAddress && (
                  <p className="text-gray-300">
                    <strong>Factory Address:</strong>{' '}
                    <a
                      href={`https://basescan.org/address/${result.contract.factoryAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-gray-400"
                    >
                      {result.contract.factoryAddress} ↗
                    </a>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-red-400">{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
