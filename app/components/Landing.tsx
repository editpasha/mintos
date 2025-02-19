/**
 * Landing Page Component
 * 
 * Displays the main landing page in production environment with:
 * - Platform overview and benefits
 * - Minting commands and instructions
 * - Benefits for casters (50% earnings), minters (5% earnings), and collectors
 * - Contact information with Warpcast profile
 * 
 * This component is only shown when NEXT_PUBLIC_NODE_ENV is set to 'production'
 */
export default function Landing() {
  return (
    <main className="min-h-screen p-3 sm:p-8 mx-auto max-w-7xl">
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Turn Farcaster Casts Into NFTs
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl">
          Mint any memorable cast as a unique NFT and create value from social content
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-12">
          <div className="p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">For Casters</h2>
            <ul className="space-y-3 text-left">
              <li>• Earn 50% when your casts are minted</li>
              <li>• No setup or configuration needed</li>
              <li>• Automatic Zora integration</li>
              <li>• Build value from your content</li>
            </ul>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">For Minters</h2>
            <ul className="space-y-3 text-left">
              <li>• Earn 5% by minting great casts</li>
              <li>• Just reply with !mint command</li>
              <li>• Automatic revenue sharing</li>
              <li>• Help creators monetize</li>
            </ul>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">For Collectors</h2>
            <ul className="space-y-3 text-left">
              <li>• Own pieces of Farcaster history</li>
              <li>• Support your favorite creators</li>
              <li>• Join the Farcaster NFT community</li>
              <li>• Build your NFT collection</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 p-6 border border-gray-200 rounded-lg max-w-4xl w-full">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 gap-6 text-left">
            <div>
              <h3 className="font-medium mb-2">Simple One-Click Minting</h3>
              <p className="text-gray-600 mb-4">Reply to any cast with one of these commands to mint it as an NFT:</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <code className="bg-black text-white p-2 rounded text-center">!mint</code>
                <code className="bg-black text-white p-2 rounded text-center">ok banger</code>
                <code className="bg-black text-white p-2 rounded text-center">@edit mint</code>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Automatic Zora Minting</h3>
              <p className="text-gray-600">The NFT is automatically minted on Zora and a mint frame is replied to the original cast, making it easy for others to collect.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="https://warpcast.com/edit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full hover:bg-gray-900 transition-colors"
          >
            <img 
              src="/images/edit.jpeg" 
              alt="@edit" 
              className="w-6 h-6 rounded-full"
            />
            <span>Contact @edit on Warpcast</span>
          </a>
        </div>
      </div>
    </main>
  )
}
