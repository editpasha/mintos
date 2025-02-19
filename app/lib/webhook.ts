import crypto from 'crypto'

/**
 * Verifies the signature of incoming Neynar webhooks
 * @see https://docs.neynar.com/docs/how-to-verify-the-incoming-webhooks-using-signatures
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): boolean {
  if (!signature || !timestamp) {
    return false
  }

  // Recreate the signature using the webhook secret
  const signaturePayload = timestamp + '.' + payload
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex')

  // Compare signatures using a timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
