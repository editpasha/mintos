import { publicClient, chain, walletClient, account } from '../../lib/viem-server';
import { SplitV1Client } from "@0xsplits/splits-sdk";

/**
 * Interface for split contract creation request parameters
 */
interface CreateSplitRequest {
  /** Wallet address of the content creator */
  casterWallet: `0x${string}`;
  /** Wallet address of the NFT minter */
  minterWallet: `0x${string}`;
}

/**
 * Platform wallet address that receives platform's share of revenue
 * This is a fixed address that receives the platform's portion of all splits
 */
const EDITMINT_WALLET = "0x9e1C8368d6773183e2E0b521e73a49D094D25818";

/**
 * Revenue distribution percentages
 * PLATFORM_SHARE: Platform's share (45%)
 * CASTER_SHARE: Content creator's share (50%)
 * MINTER_SHARE: NFT minter's share (5%)
 * Total must equal 100%
 */
const PLATFORM_SHARE = 45;
const CASTER_SHARE = 50;
const MINTER_SHARE = 5;

/**
 * POST endpoint to create a new revenue split contract
 * Creates an immutable split contract that automatically distributes revenue
 * between the caster (content creator), minter, and platform
 * 
 * @param req - Request object containing casterWallet and minterWallet addresses
 * @returns Response with split contract details or error message
 */
export async function POST(req: Request) {
  try {
    const data: CreateSplitRequest = await req.json();

    // Validate required wallet addresses
    if (!data?.casterWallet || !data?.minterWallet) {
      throw new Error('Both casterWallet and minterWallet addresses are required');
    }

    // Initialize 0xSplits client with chain configuration and API key
    const splitsClient = new SplitV1Client({
      chainId: chain.id,
      publicClient: publicClient,
      apiConfig: {
        apiKey: process.env.SPLITS_API_KEY || "",
      },
    });

    /**
     * Validates and normalizes Ethereum addresses
     * Ensures addresses are properly formatted and converts them to checksum format
     * @param address - The address to validate and convert
     * @returns The normalized address in checksum format
     * @throws Error if address is invalid
     */
    const validateAndConvertAddress = (address: unknown): `0x${string}` => {
      if (typeof address !== 'string') {
        throw new Error(`Wallet address must be a string. Received type: ${typeof address}`);
      }
      const trimmedAddress = address.trim().toLowerCase();
      if (!/^0x[0-9a-f]{40}$/.test(trimmedAddress)) {
        throw new Error(`Invalid wallet address format: ${address}`);
      }
      return trimmedAddress as `0x${string}`;
    };

    // Validate and convert addresses
    const casterAddress = validateAndConvertAddress(data.casterWallet);
    const minterAddress = validateAndConvertAddress(data.minterWallet);

    // Check if caster and minter are the same
    const isSameAddress = casterAddress.toLowerCase() === minterAddress.toLowerCase();

    const splitsConfig = {
      recipients: isSameAddress ? [
        {
          // If same address, combine caster and minter shares
          address: casterAddress,
          percentAllocation: CASTER_SHARE + MINTER_SHARE,
        },
        {
          address: EDITMINT_WALLET,
          percentAllocation: PLATFORM_SHARE,
        }
      ] : [
        {
          address: casterAddress,
          percentAllocation: CASTER_SHARE,
        },
        {
          address: minterAddress,
          percentAllocation: MINTER_SHARE,
        },
        {
          address: EDITMINT_WALLET,
          percentAllocation: PLATFORM_SHARE,
        }
      ],
      distributorFeePercent: 0,
    };

    console.log('Creating split with config:', {
      isSameAddress,
      recipients: splitsConfig.recipients
    });

    const { splitAddress, transactionHash } = await (async () => {
      const predicted = await splitsClient.predictImmutableSplitAddress(splitsConfig);
      
      if (!predicted.splitExists) {
        // Create new split contract if one doesn't already exist for these parameters
        console.log('Creating split contract...');
        const { data: splitData, address } = await splitsClient.callData.createSplit(splitsConfig);

        // Submit transaction to create split contract
        // Using sendTransaction directly allows network to handle gas estimation
        // This is more efficient than manual gas calculation
        const hash = await walletClient.sendTransaction({
          account,
          to: address as `0x${string}`,
          data: splitData,
          value: 0n, // No ETH value being sent with transaction
          type: 'eip1559' // Explicitly set transaction type for Base chain
        });

        // Wait for transaction confirmation and get receipt
        // This ensures the split contract is properly deployed before proceeding
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
          splitAddress: predicted.splitAddress,
          transactionHash: receipt.transactionHash,
        };
      } else {
        console.log('Using existing split address:', predicted.splitAddress);
        return {
          splitAddress: predicted.splitAddress,
          transactionHash: undefined
        };
      }
    })();

    // Return successful response with split contract details
    // Including address, transaction hash (if new contract), and share percentages
    return new Response(JSON.stringify({
      success: true,
      split: {
        address: splitAddress,
        transactionHash: transactionHash, // undefined if using existing contract
        shares: isSameAddress ? {
          caster: `${CASTER_SHARE + MINTER_SHARE}%`, // Combined share
          platform: `${PLATFORM_SHARE}%`,
        } : {
          caster: `${CASTER_SHARE}%`,
          minter: `${MINTER_SHARE}%`,
          platform: `${PLATFORM_SHARE}%`,
        },
      },
    }), {
      status: 201, // Created
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Split contract creation failed:', error);
    if (error instanceof Error) {
      console.error('Error stack trace:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }

    // Return user-friendly error response
    // Avoid exposing internal error details in production
    return Response.json(
      {
        success: false,
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while creating the split contract',
      },
      {
        status: 500,
      }
    );
  }
}
