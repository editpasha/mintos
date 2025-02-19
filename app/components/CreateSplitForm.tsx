/**
 * CreateSplitForm Component
 * 
 * A form component for creating split contracts using 0xSplits protocol.
 * Creates a revenue sharing contract with predefined percentages:
 * - Caster: 50%
 * - Minter: 5%
 * - Platform: 45% (fixed address)
 */

'use client'

import { useState } from 'react'
import { api } from '../lib/api'

/** Platform wallet address that receives 45% of revenue */
const PLATFORM_WALLET = "0x9e1C8368d6773183e2E0b521e73a49D094D25818"

export default function CreateSplitForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string; split?: { address: string; transactionHash?: string } } | null>(null)
  const [walletAddresses, setWalletAddresses] = useState<{
    casterWallet: string;
    minterWallet: string;
  } | null>(null)

  /**
   * Handles form submission for split contract creation
   * 1. Collects wallet addresses from form
   * 2. Creates split contract with predefined shares
   * 3. Displays contract address and share configuration
   */
  const isValidEthereumAddress = (address: string) => {
    // Regex to validate Ethereum address: starts with 0x, followed by 40 hex characters
    const ethereumAddressRegex = /^0x[0-9a-fA-F]{40}$/;
    return ethereumAddressRegex.test(address.trim());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)

    const casterWallet = (formData.get('casterWallet') as string)?.trim()
    const minterWallet = (formData.get('minterWallet') as string)?.trim()

    // Validate wallet addresses
    if (!casterWallet || !minterWallet) {
      setResult({
        success: false,
        error: 'Both wallet addresses are required',
      })
      setIsLoading(false)
      return
    }

    if (!isValidEthereumAddress(casterWallet) || !isValidEthereumAddress(minterWallet)) {
      setResult({
        success: false,
        error: 'Invalid Ethereum wallet address format. Must start with 0x and be 42 characters long.',
      })
      setIsLoading(false)
      return
    }

    try {
      console.log('Submitting split creation with:', { casterWallet, minterWallet });
      const data = await api.createSplit({
        casterWallet,
        minterWallet,
      });
      
      console.log('Split creation response:', data);
      
      setWalletAddresses({
        casterWallet,
        minterWallet,
      });
      
      setResult(data);
    } catch (error) {
      console.error('Error in split creation:', error);
      
      setResult({
        success: false,
        error: error instanceof Error 
          ? `${error.name}: ${error.message}` 
          : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
}

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 sm:mb-8">Create Split Wallet</h1>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
            Will receive 50% of revenue
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
            Will receive 5% of revenue
          </p>
        </div>

        <p className="text-sm text-gray-400">
          Platform wallet ({PLATFORM_WALLET}) will receive 45% of revenue
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-2 sm:py-3 px-4 rounded border border-black hover:bg-transparent hover:text-white disabled:bg-gray-800 disabled:border-gray-800 disabled:text-gray-500 text-sm sm:text-base"
        >
          {isLoading ? 'Creating...' : 'Create Split Wallet'}
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
                  <span className="font-mono">{PLATFORM_WALLET}</span>
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
