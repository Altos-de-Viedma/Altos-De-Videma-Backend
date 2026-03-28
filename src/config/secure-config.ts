// Secure Secrets Management Script
// No external dependencies - uses only Node.js built-ins

import { readFileSync, existsSync } from 'fs';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class SecureConfig {
  private static instance: SecureConfig;
  private secrets: Map<string, string> = new Map();

  private constructor() {
    this.loadSecrets();
  }

  static getInstance(): SecureConfig {
    if (!SecureConfig.instance) {
      SecureConfig.instance = new SecureConfig();
    }
    return SecureConfig.instance;
  }

  private loadSecrets(): void {
    // Priority: Environment variables > Encrypted file > Default
    const secretKeys = [
      'DB_PASSWORD',
      'JWT_SECRET',
      'SESSION_SECRET',
      'N8N_URL'
    ];

    secretKeys.forEach(key => {
      // 1. Try environment variable first
      if (process.env[key]) {
        this.secrets.set(key, process.env[key]);
        return;
      }

      // 2. Try encrypted secrets file (if exists)
      const encryptedPath = `/run/secrets/${key.toLowerCase()}`;
      if (existsSync(encryptedPath)) {
        try {
          const encrypted = readFileSync(encryptedPath, 'utf8');
          const decrypted = this.decrypt(encrypted);
          this.secrets.set(key, decrypted);
        } catch (error) {
          console.error(`Failed to load secret ${key}:`, error.message);
        }
      }
    });
  }

  getSecret(key: string): string {
    const secret = this.secrets.get(key);
    if (!secret) {
      throw new Error(`Secret ${key} not found. Check environment variables or secrets file.`);
    }
    return secret;
  }

  private decrypt(encryptedData: string): string {
    // Simple decryption using master key from environment
    const masterKey = process.env.MASTER_KEY;
    if (!masterKey) {
      throw new Error('MASTER_KEY environment variable required for decryption');
    }

    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = createHash('sha256').update(masterKey).digest();

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Utility to encrypt secrets (for setup only)
  static encryptSecret(plaintext: string, masterKey: string): string {
    const iv = randomBytes(16);
    const key = createHash('sha256').update(masterKey).digest();

    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }
}