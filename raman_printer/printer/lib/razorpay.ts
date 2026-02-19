import Razorpay from 'razorpay';
import { env } from '@/lib/env';

/**
 * Returns a validated Razorpay instance.
 * Throws a descriptive error early if required env vars are missing,
 * preventing silent failures in payment routes.
 */
export function getRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Returns the Razorpay key secret, validated.
 * Use this in payment verification routes.
 */
export function getRazorpaySecret(): string {
  return env.RAZORPAY_KEY_SECRET;
}
