/**
 * Represents the response structure for all API operations in the application.
 * This interface is used across different forms to handle their responses consistently.
 */
export interface Result {
  /** Indicates if the operation was successful */
  success: boolean

  /** Contract creation result - returned by createContract API */
  contract?: {
    /** The deployed contract's address */
    address: string
    /** Transaction hash of the contract creation */
    transactionHash: string
    /** Address of the factory contract used to deploy */
    factoryAddress: string
  }

  /** Split contract result - returned by createSplit API */
  split?: {
    /** The deployed split contract's address */
    address: string
    /** Transaction hash of the split contract creation (optional for existing contracts) */
    transactionHash?: string
    /** Revenue sharing configuration (optional for existing contracts) */
    shares?: {
      /** Caster's share (50%) */
      caster: string
      /** Minter's share (5%) */
      minter: string
      /** Platform's share (45%) */
      platform: string
    }
  }

  /** Token creation result - returned by createToken API */
  token?: {
    /** Transaction hash of the token creation */
    transactionHash: string
    /** Address of the contract where token was created */
    contractAddress?: string
    /** Address of the split contract for revenue sharing */
    splitAddress?: string
  }

  /** IPFS upload result - returned by ipfs API */
  ipfs?: {
    /** IPFS URL of the uploaded file */
    url: string
  }

  /** Error message in case of failure */
  error?: string
}
