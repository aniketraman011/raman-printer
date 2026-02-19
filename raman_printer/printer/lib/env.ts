/**
 * Centralised environment-variable validation.
 *
 * Import this module in any server-side file that needs env vars to be
 * present. It throws a clear, actionable error at startup rather than at
 * runtime inside a request handler.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   const uri = env.MONGODB_URI;
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Copy .env.example to .env.local and fill in your values.`
    );
  }
  return value;
}

export const env = {
  get MONGODB_URI() {
    return requireEnv('MONGODB_URI');
  },
  get NEXTAUTH_SECRET() {
    return requireEnv('NEXTAUTH_SECRET');
  },
  get NEXTAUTH_URL() {
    return process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  },
  get RAZORPAY_KEY_ID() {
    return requireEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID');
  },
  get RAZORPAY_KEY_SECRET() {
    return requireEnv('RAZORPAY_KEY_SECRET');
  },
  get BLOB_READ_WRITE_TOKEN() {
    return process.env.BLOB_READ_WRITE_TOKEN;
  },
  get NODE_ENV() {
    return (process.env.NODE_ENV as 'development' | 'production' | 'test') ?? 'development';
  },
} as const;
