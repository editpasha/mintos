import { publicClient, walletClient, creatorAccount, account } from '../../lib/viem-server';
import { create1155 } from "@zoralabs/protocol-sdk";
import { encodeFunctionData, parseEther } from 'viem';

/**
 * Interface for contract creation request parameters
 */
interface CreateContractRequest {
  /** Name of the ERC-1155 contract */
  name: string;
  /** Base URI for contract-level metadata */
  uri: string;
  /** URI for token-level metadata */
  tokenUri: string;
  /** Optional split contract address for revenue distribution */
  splitAddress?: `0x${string}`;
}

/**
 * POST endpoint to create a new ERC-1155 contract using Zora protocol
 * Creates a new contract and initializes it with the provided metadata
 * Supports optional revenue split integration through splitAddress
 * 
 * @param req - Request object containing contract creation parameters
 * @returns Response with contract details including address and transaction hash
 * @throws Error if required parameters are missing or invalid
 */
export async function POST(req: Request) {
  try {
    console.log('Starting contract creation process...');
    const data: CreateContractRequest = await req.json();
    console.log('Received request data:', data);

    // Validate required parameters
    if (!data.name || !data.uri || !data.tokenUri) {
      throw new Error('Missing required parameters: name, uri, or tokenUri');
    }

    // Prepare contract creation parameters with Zora SDK configuration
    const contractParams = {
      publicClient,
      contract: {
        name: data.name,
        uri: data.uri,
      },
      token: {
        tokenMetadataURI: data.tokenUri,
        ...(data.splitAddress && {
          payoutRecipient: data.splitAddress,
        }),
      },
      account: creatorAccount,
    };

    console.log('Creating 1155 contract with params:', contractParams);
    // Create 1155 contract
    const { parameters, contractAddress } = await create1155(contractParams);
    console.log('Contract created successfully:', { contractAddress, parameters });

    // Encode function data with error handling
    if (!parameters.abi || !parameters.functionName || !parameters.args) {
      throw new Error('Invalid contract parameters from Zora SDK');
    }

    const txData = encodeFunctionData({
      abi: parameters.abi,
      functionName: parameters.functionName,
      args: parameters.args,
    });
    console.log('Function data encoded:', { functionName: parameters.functionName });

    // Submit transaction to create contract
    // Using sendTransaction directly allows network to handle gas estimation
    console.log('Sending transaction...');
    const txHash = await walletClient.sendTransaction({
      account,
      to: parameters.address as `0x${string}`,
      data: txData,
      value: parseEther('0'), // No ETH value being sent with transaction
      type: 'eip1559' // Explicitly set transaction type for Base chain
    });

    console.log('Transaction sent, hash:', txHash);
    
    // Wait for transaction confirmation and get receipt
    // This ensures the contract is properly deployed before proceeding
    console.log('Waiting for transaction receipt...');
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash
    });
    console.log('Transaction receipt received:', receipt);
    
    // Return successful response with contract details
    return new Response(JSON.stringify({
      success: true,
      contract: {
        address: contractAddress, // The deployed contract address
        transactionHash: receipt.transactionHash, // Transaction hash for tracking
        factoryAddress: parameters.address as string // Zora factory address used
      }
    }), {
      status: 201, // Created
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // Log detailed error information for debugging
    console.error('Contract creation failed:', error);
    if (error instanceof Error) {
      console.error('Error stack trace:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }

    // Return user-friendly error response
    // Avoid exposing internal error details in production
    return Response.json({ 
      success: false, 
      error: error instanceof Error 
        ? error.message
        : 'An unexpected error occurred while creating the contract'
    }, { 
      status: 500 
    });
  }
}
