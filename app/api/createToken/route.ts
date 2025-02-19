import { publicClient, creatorAccount, chain, walletClient, account } from '../../lib/viem-server';
import { createNew1155Token } from "@zoralabs/protocol-sdk";
import { encodeFunctionData, parseEther } from 'viem';

/**
 * Interface for token creation request parameters
 */
interface CreateTokenRequest {
  /** Address of the ERC-1155 contract to mint the token on */
  contractAddress: `0x${string}`;
  /** URI for token metadata */
  tokenUri: string;
  /** Split contract address for revenue distribution */
  splitAddress: `0x${string}`;
}

/**
 * POST endpoint to create a new token in an existing ERC-1155 contract
 * Creates a new token with specified metadata and revenue split configuration
 * Uses Zora protocol for token creation
 * 
 * @param req - Request object containing token creation parameters
 * @returns Response with transaction details
 * @throws Error if required parameters are missing or invalid
 */
export async function POST(req: Request) {
  try {
    console.log('Starting token creation process...');
    const data: CreateTokenRequest = await req.json();
    console.log('Received request data:', data);

    // Validate input
    if (!data.contractAddress || !data.tokenUri || !data.splitAddress) {
      throw new Error('Missing required parameters: contractAddress, tokenUri, or splitAddress');
    }

    // Create new token with SDK
    console.log('Creating token with params:', {
      contractAddress: data.contractAddress,
      tokenUri: data.tokenUri,
      splitAddress: data.splitAddress,
      chainId: chain.id
    });
    const { parameters, newTokenId } = await createNew1155Token({
      contractAddress: data.contractAddress,
      token: {
        tokenMetadataURI: data.tokenUri,
        payoutRecipient: data.splitAddress as `0x${string}`,
      },
      account: creatorAccount,
      chainId: chain.id,
    });

    console.log('Token parameters prepared:', {
      address: parameters.address,
      functionName: parameters.functionName,
      argsLength: parameters.args?.length
    });

    // Encode function data with error handling
    if (!parameters.abi || !parameters.functionName || !parameters.args) {
      throw new Error('Invalid token parameters from Zora SDK');
    }

    const txData = encodeFunctionData({
      abi: parameters.abi,
      functionName: parameters.functionName,
      args: parameters.args,
    });
    console.log('Function data encoded:', { functionName: parameters.functionName });

    // Submit transaction to create token
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
    console.log('Waiting for transaction receipt...');
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash
    });
    console.log('Transaction receipt received:', receipt);

    // Use newTokenId from SDK response
    if (!newTokenId) {
      throw new Error('New token ID not returned by Zora SDK');
    }
    console.log('New token ID:', newTokenId.toString());
    
    // Convert BigInt values to strings for JSON serialization
    const responseData = {
      success: true,
      token: {
        transactionHash: receipt.transactionHash,
        contractAddress: data.contractAddress,
        splitAddress: data.splitAddress,
        status: 'confirmed',
        blockNumber: receipt.blockNumber.toString(),
        tokenId: newTokenId.toString(),
        // Include additional receipt data as strings
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString()
      }
    };

    // Return successful response with token creation details
    return new Response(JSON.stringify(responseData), {
      status: 201, // Created
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // Log detailed error information for debugging
    console.error('Token creation failed:', error);
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
        : 'An unexpected error occurred while creating the token'
    }, { 
      status: 500 
    });
  }
}
