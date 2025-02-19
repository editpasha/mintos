/**
 * Root Layout Component
 * 
 * This is the root layout component that wraps all pages in the application.
 * It provides:
 * - Common HTML structure
 * - Inter font integration
 * - Global CSS imports
 * - Application providers wrapper
 * - Meta information for SEO
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers/Providers'

// Initialize Inter font with Latin character subset
const inter = Inter({ subsets: ['latin'] })

// Define application metadata for SEO
export const metadata: Metadata = {
  title: 'Mintos',
  description: 'Mint NFTs on Base',
}

/**
 * Root Layout Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be rendered
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
