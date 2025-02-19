/**
 * API Error Handling Utilities
 * 
 * This module provides standardized error handling for API routes.
 * It includes a custom APIError class and a handler function that
 * converts various error types into consistent API responses.
 */

import { NextResponse } from 'next/server';

/**
 * Custom API Error class for handling API-specific errors
 * 
 * @extends Error
 * @property {number} statusCode - HTTP status code to return (default: 500)
 * @property {string} code - Error code identifier (default: INTERNAL_SERVER_ERROR)
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Handles API errors and converts them to standardized responses
 * 
 * Processes different types of errors:
 * - APIError: Uses provided status code and error code
 * - ValidationError: Returns 400 status with VALIDATION_ERROR code
 * - Other errors: Returns 500 status with INTERNAL_SERVER_ERROR code
 * 
 * @param error - The error to handle
 * @returns NextResponse with appropriate status code and error details
 */
export function handleAPIError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code 
      },
      { status: error.statusCode }
    );
  }

  // Handle validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json(
      { 
        error: error.message,
        code: 'VALIDATION_ERROR' 
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { 
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    },
    { status: 500 }
  );
}
