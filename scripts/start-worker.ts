/**
 * Script to start the minting worker process.
 * Run with: npx tsx scripts/start-worker.ts
 * 
 * This worker:
 * 1. Processes minting queue one item at a time
 * 2. Handles retries via failed queue
 * 3. Maintains proper error handling
 * 4. Provides logging for monitoring
 */

// Set worker process flag
process.env.WORKER_PROCESS = 'true';

// Import worker
require('../app/workers/mint-worker');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down worker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down worker...');
  process.exit(0);
});

// Keep process running
process.stdin.resume();

console.log('Worker process starting...');
