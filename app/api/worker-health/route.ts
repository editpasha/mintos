import { NextResponse } from 'next/server';

// Simple health check that doesn't depend on Redis
export async function GET() {
  return new NextResponse(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
