// src/utils/crypto.ts
import { randomBytes, createHash } from 'crypto';

export interface GeneratedKeyPayload {
  rawKey: string;       // Handed to the user ONCE (never shown again)
  prefix: string;       // Stored in DB for lookup
  hash: string;         // SHA-256 hash stored in DB
}

export class CryptoUtils {
  private static PREFIX = 'nop_live';

  /**
   * Generates a Stripe-style API key and its corresponding hash
   */
  static generateApiKey(): GeneratedKeyPayload {
    // 1. Generate random bytes for lookup identity and the actual secret
    const lookupId = randomBytes(4).toString('hex'); // 8 characters
    const secretToken = randomBytes(24).toString('hex'); // 48 characters

    // 2. Build the user-facing key
    const prefix = `${this.PREFIX}_${lookupId}`;
    const rawKey = `${prefix}_${secretToken}`;

    // 3. Hash the secret portion using SHA-256
    const hash = this.hashSecret(secretToken);

    return {
      rawKey,
      prefix,
      hash,
    };
  }

  /**
   * Computes a highly efficient SHA-256 hash of the secret token
   */
  static hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }
}