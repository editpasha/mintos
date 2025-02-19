# Mintos - NFT Creation & Split Revenue Platform

A web application that serves as a backend service for NFT creation from Neynar casts in production, and provides functionality for creating NFT contracts, tokens with split revenue, and managing IPFS uploads on the Base network in development.

## Features

### Production Environment
- **Command-Based Minting**: Mint any Farcaster cast as an NFT by replying with:
  - `!mint`
  - `ok banger`
  - `@edit mint`
  
  Regex pattern for command validation:
  ```go
  ^(?i)(!mint|ok\s+banger|@edit\s+mint)$
  ```
  - Case insensitive matching
  - Handles whitespace variations
  - Exact phrase matching only
- **Automatic Zora Integration**: NFTs are automatically minted on Zora
- **Frame Generation**: Mint frames are automatically replied to the original cast
- **Metadata Management**: Stores cast content and author information as NFT metadata
- **Revenue Generation**: Both casters and minters earn from NFT mints
- **Queue System**: Processes mints through Redis queue for reliability

### Development Environment Only (Hidden in Production)
- **Create NFT Contracts**: Test creation of NFT contracts with customizable names and images
- **Create Tokens with Split Revenue**: Test token creation with revenue splitting
- **Direct IPFS Upload**: Test file uploads to IPFS via Pinata
- **Split Wallet Creation**: Test creation of split wallets with predefined shares
- **Cast Preview Generation**: Generate preview images for Farcaster casts
- **Cast Image Creation**: Create and upload cast images to IPFS

## Tech Stack

- **Frontend**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS
- **Blockchain**: Base Network (Ethereum L2)
- **Smart Contracts**: 
  - Zora Protocol SDK for NFT contracts
  - 0xSplits SDK for revenue splitting
- **Storage**: 
  - IPFS via Pinata for NFT assets
  - Redis for deduplication
  - Supabase for minting history
- **Social Integration**:
  - Neynar SDK for Farcaster data and webhooks

## API Routes

### Production Endpoint

### `/api/webhook/neynar`
Handles webhooks from Neynar for automatic NFT creation from casts.
```typescript
POST {
  type: string;  // e.g., "cast.created"
  data: {
    hash: string;
    text: string;
    author: {
      username: string;
      display_name: string;
      pfp_url: string;
    }
  }
}

// Required Headers
x-neynar-signature: string    // Webhook signature for verification
x-neynar-timestamp: string    // Timestamp of the request
```

### Development Endpoints Only

### `/api/generatePreview`
Generates a preview image for a Farcaster cast.
```typescript
POST {
  hash: string;  // Cast hash
}
// Returns: PNG image
```

### `/api/createImage`
Creates an image for a Farcaster cast and uploads it to IPFS.
```typescript
POST {
  hash: string;  // Cast hash
}
// Returns: { url: string }  // IPFS URL of the generated image
```

### `/api/createContract`
Creates a new NFT contract using Zora's protocol.
```typescript
POST {
  name: string;
  uri: string;
  tokenUri: string;
}
```

### `/api/createToken`
Creates a new token with split payouts.
```typescript
POST {
  contractAddress: string;
  tokenUri: string;
  splitAddress: string;
}
```

### `/api/createSplit`
Creates a split contract with predefined shares.
```typescript
POST {
  casterWallet: string;
  minterWallet: string;
}
```

### `/api/ipfs`
Uploads files to IPFS via Pinata.
```typescript
POST FormData | JSON
Max file size: 2GB
Supports: Any file type
```

### `/api/webhook/neynar`
Handles webhooks from Neynar for automatic NFT creation from casts.
```typescript
POST {
  type: string;  // e.g., "cast.created"
  data: {
    hash: string;
    text: string;
    author: {
      username: string;
      display_name: string;
      pfp_url: string;
    }
  }
}

// Required Headers
x-neynar-signature: string    // Webhook signature for verification
x-neynar-timestamp: string    // Timestamp of the request
```

## Storage Architecture

The application uses a hybrid storage solution:

### Redis
- Used for fast deduplication of processed casts
- Prevents duplicate minting of the same cast
- Implemented using Redis SET operations
- Hosted on Railway for production

### Supabase
- Persistent storage for minted NFT history
- Stores complete metadata:
  - Cast details (hash, caster, minter)
  - NFT details (Zora URL, contract, token)
  - Timestamps for tracking
- Row Level Security enabled:
  - Service role for backend operations
  - Public read access for queries
- Indexed for fast lookups

## Queue System

The application uses a Redis-based queue system for processing mints:

### Queue Architecture
- **Redis Implementation**: 
  - Singleton pattern for connection management
  - Automatic reconnection handling
  - Type-safe Redis operations
  - Shared Redis instance between services
- **Queues**:
  - mint_queue: Pending mint requests
  - failed_mint_queue: Failed mints for retry
- **Two-Service Architecture**:
  - Web Service: Handles API requests and queues mints
  - Worker Service: Dedicated to processing the mint queue

### How It Works
1. Webhook receives mint request
2. Request is added to mint_queue
3. Worker processes one mint at a time
4. Failed mints go to retry queue
5. 5-second delay between processing attempts

### Benefits
- Reliable processing of concurrent requests
- Automatic retries for failed mints
- Better resource management
- Improved error handling
- Built-in monitoring
- Shared Redis connection reduces complexity

## Environment-Based Routing

The application provides different interfaces based on the environment:

### Production
- Shows a minimal landing page explaining the platform
- Highlights command-based minting process
- Displays benefits for casters and collectors
- All API routes are blocked except Neynar webhook

### Development
- Provides full access to all development tools and forms
- All API routes are accessible with proper authentication
- Enables testing of all platform features

## Project Structure

```bash
scripts/
└── start-worker.ts          # Worker process starter

supabase/
└── migrations/                # Database migrations
    └── 20240218_create_minted_casts.sql  # Minted casts table schema

app/
├── api/                      # API route handlers
│   ├── createContract/       # Contract creation endpoint
│   ├── createImage/         # Cast image generation and IPFS upload
│   ├── createSplit/         # Split contract creation
│   ├── createToken/         # Token creation with splits
│   ├── generatePreview/     # Cast preview generation
│   │   ├── components/      # Preview components
│   │   │   ├── Cast.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ImageEmbed.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── QuotedCast.tsx
│   │   ├── config/         # Preview configuration
│   │   │   └── constants.ts
│   │   ├── services/       # External services
│   │   │   └── neynar.ts
│   │   ├── types/         # Type definitions
│   │   │   └── index.ts
│   │   └── utils/         # Utility functions
│   │       ├── calculations.ts
│   │       ├── error-handler.ts
│   │       ├── twitter.ts
│   │       └── video.ts
│   ├── ipfs/              # IPFS upload endpoint
│   └── webhook/           # Webhook endpoints
│       └── neynar/        # Neynar webhook handler
├── components/            # React components
│   ├── CreateContractForm.tsx
│   ├── CreateImage.tsx
│   ├── CreateSplitForm.tsx
│   ├── CreateTokenForm.tsx
│   ├── ExampleCasts.tsx
│   ├── Footer.tsx
│   ├── GeneratePreview.tsx
│   └── IpfsUploadForm.tsx
├── lib/                  # Utility functions and configurations
│   ├── api.ts           # API client utilities
│   ├── ipfs.ts          # IPFS upload utilities
│   ├── neynar.ts        # Neynar client configuration
│   ├── redis.ts         # Redis queue client
│   ├── supabase.ts      # Supabase client
│   ├── viem-server.ts   # Viem client configuration
│   └── webhook.ts       # Webhook utilities
├── workers/             # Worker processes
│   └── mint-worker.ts   # Minting queue processor
├── providers/           # React context providers
│   └── Providers.tsx
├── config.ts           # Environment and server configuration
├── types.ts           # TypeScript type definitions
├── globals.css        # Global styles
├── layout.tsx        # Root layout component
├── middleware.ts     # Next.js middleware
└── page.tsx         # Home page component
```

## Environment Variables

Create a `.env.local` file with the following variables:

### Storage Configuration
```env
# Redis Configuration
REDIS_URL=your_redis_url                           # Redis connection URL with auth

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url          # Supabase project URL
SUPABASE_SERVICE_KEY=your_service_role_key         # Service role key for DB access
```

### Other Configuration

```env
# Blockchain Configuration
PRIVATE_KEY=your_wallet_private_key                 # Ethereum private key for transaction signing
BASE_RPC_URL=your_base_network_rpc_url             # Base network RPC URL

# Neynar Configuration
NEYNAR_API_KEY=your_neynar_api_key                 # API key for Neynar SDK
NEYNAR_WEBHOOK_SECRET=your_neynar_webhook_secret   # Webhook secret for verifying Neynar requests
NFT_CONTRACT_ADDRESS=your_nft_contract_address     # Contract to mint NFTs in production

# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key                 # Pinata API key
PINATA_SECRET_API_KEY=your_pinata_secret_key       # Pinata secret key
PINATA_JWT=your_pinata_jwt_token                   # Pinata JWT for authentication

# 0xSplits Configuration
SPLITS_API_KEY=your_splits_api_key                 # API key for 0xSplits SDK

# API Security
API_KEY=your_secure_api_key_here                   # Server-side API key
NEXT_PUBLIC_API_KEY=your_secure_api_key_here       # Client-side API key
NEXT_PUBLIC_APP_URL=http://localhost:3000          # Application URL for CORS
```

> ⚠️ Never commit your actual environment variables to version control. The values above are just examples.

## API Security

The API endpoints are protected with:

1. **API Key Authentication**: All API requests require an `x-api-key` header matching the `API_KEY` environment variable.
2. **CORS Protection**: Requests are only allowed from the domains specified in `NEXT_PUBLIC_APP_URL` and localhost.

To make API requests:
```typescript
// The frontend automatically includes the API key from NEXT_PUBLIC_API_KEY
import { api } from '../lib/api'

// Use the api utility functions
const response = await api.createContract({
  name: 'My NFT Collection',
  uri: 'ipfs://...',
  tokenUri: 'ipfs://...'
})
```

## Landing Page

The production environment features a minimal, elegant landing page that:
- Explains the command-based minting process (`!mint`, `ok banger`, `@edit mint`)
- Highlights benefits for casters and minters (both earn from mints) and collectors
- Shows automatic Zora integration and frame generation
- Maintains a clean black and white design aesthetic

## Environment Setup

### Environment Configuration
```env
# Environment Configuration
NEXT_PUBLIC_NODE_ENV=production    # Shows landing page when set to 'production'
```

### Production
1. Deploy TWO services from the same repository:

   a. Web Service:
   - Handles API requests and webhook
   - Start command: `npm run start`
   - Environment variables:
   ```env
   NEYNAR_WEBHOOK_SECRET=your-webhook-secret
   NFT_CONTRACT_ADDRESS=your-contract-address
   REDIS_URL=your-redis-url
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_KEY=your-service-role-key
   API_KEY=your-api-key
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

   b. Worker Service:
   - Processes mint queue
   - Start command: `tsx scripts/start-worker.ts`
   - Environment variables:
   ```env
   WORKER_PROCESS=true
   REDIS_URL=your-redis-url
   API_KEY=your-api-key
   NEYNAR_SIGNER_UUID=your-signer-uuid
   NEXT_PUBLIC_CONTRACT_ADDRESS=your-contract-address
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

2. Set up storage services:
   - Create a Redis instance (shared between both services)
   - Create a Supabase project and run migrations

3. Configure Neynar webhook:
   - URL: https://your-domain.com/api/webhook/neynar
   - Events: cast.created
   - Get webhook secret from Neynar dashboard

4. Verify Deployment:
   - Check web service logs for webhook processing
   - Check worker service logs for mint processing
   - Monitor Redis connection status in both services

### Development
1. Clone the repository:
```bash
git clone https://github.com/editpasha/mintos.git
cd mintos
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your API keys.

4. Run the development server and worker:
```bash
npm run start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Server-Side Configuration
- `config.ts`: Manages environment variables and server-side configuration
- `lib/viem-server.ts`: Configures blockchain clients for server-side operations
- `lib/ipfs.ts`: Handles IPFS upload functionality through Pinata
- `lib/redis.ts`: Redis client for deduplication
- `lib/supabase.ts`: Supabase client for minting history

### API Routes
All API routes are server-side only and handle:
- NFT contract creation via Zora Protocol
- Split contract creation via 0xSplits
- Token minting with revenue splitting
- File uploads to IPFS

### Components
React components in the `components/` directory handle:
- Form validation and submission
- User interface elements
- Client-side state management

## Usage

1. **Creating an NFT Contract**
   - Click "Create New Contract"
   - Upload a collection image
   - Enter collection name
   - Submit to create contract on Base network
   - View contract details and transaction hash on success

2. **Creating a Token with Split Revenue**
   - Click "Create Token with Split"
   - Enter contract address
   - Upload token image
   - Fill in title and description
   - Provide caster and minter wallet addresses
   - Submit to create token with revenue splitting
   - View split wallet addresses and percentages in the success message

3. **Uploading to IPFS**
   - Click "IPFS Upload"
   - Select any file (max 2GB)
   - Upload to get IPFS URL
   - Copy URL for use in other operations

4. **Creating Split Wallet**
   - Click "Create Split Wallet"
   - Enter caster and minter wallet addresses
   - Submit to create split contract with predefined shares:
     - Caster: 50%
     - Minter: 5%
     - Platform: 45%
   - View split contract address and transaction details

5. **Generating Cast Previews**
   - Click "Cast Preview"
   - Enter a Farcaster cast hash
   - Or select from example casts
   - View the generated preview image
   - Download the image in PNG format

6. **Creating Cast Images**
   - Click "Create Cast Image"
   - Enter a Farcaster cast hash
   - Or select from example casts
   - View the generated image
   - Get IPFS URL for the uploaded image
   - Copy URL for sharing or embedding

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## TODO

### Upcoming Features
- Support for casts with video embeds
- Support for casts with embedded content:
  - Twitter embeds
  - Spotify embeds
  - SoundCloud embeds
  - Other social media embeds

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Documentation

Each core module contains detailed documentation about its functionality:

- **API Routes**: Complete documentation of endpoints, security, and validation
- **Worker Process**: Comprehensive documentation of the minting queue system
- **Core Libraries**:
  - Redis: Queue architecture and connection management
  - Supabase: Database schema and security model
  - IPFS: Content management and upload process
  - Neynar: API integration and rate limiting
  - Viem: Blockchain client configuration and security

For detailed implementation information, refer to the documentation in each module's source code.
