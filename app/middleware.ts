import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js middleware function for handling API route security and CORS settings.
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {NextResponse} The response object with appropriate security checks and headers.
 */
export function middleware(request: NextRequest) {
  // Only apply middleware to /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }


  // Allow requests to the Neynar webhook endpoint without any checks
  if (request.nextUrl.pathname === '/api/webhook/neynar') {
    return NextResponse.next()
  }


  // In production, block all API routes except the Neynar webhook endpoint
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }


  // In development, check for a valid API key in the 'x-api-key' header
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }


  // In development, verify that the request origin is allowed
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].filter(Boolean)

  if (!origin || !allowedOrigins.includes(origin)) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }


  // If all checks pass, add CORS headers for the allowed origin
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key')

  return response
}


// Configure to match all API routes
export const config = {
  matcher: '/api/:path*',
}
