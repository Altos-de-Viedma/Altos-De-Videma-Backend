#!/usr/bin/env node
/**
 * Secure Secrets Setup Utility
 * No external dependencies - uses only Node.js built-ins
 * Run this script to encrypt your secrets for production
 */

import { createHash, createCipheriv, randomBytes } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { readlineSync } from './readline-simple';

class SecretsSetup {
  private masterKey: string;

  constructor() {
    console.log('🔐 Secure Secrets Setup for Altos de Viedma');
    console.log('=====================================\n');

    this.masterKey = this.getMasterKey();
  }

  private getMasterKey(): string {
    const envMasterKey = process.env.MASTER_KEY;
    if (envMasterKey && envMasterKey.length >= 32) {
      return envMasterKey;
    }

    console.log('⚠️  MASTER_KEY not found or too short (min 32 chars)');
    console.log('Generate a strong master key for encryption:\n');

    const generated = randomBytes(32).toString('hex');
    console.log(`Suggested master key: ${generated}\n`);
    console.log('Set this as MASTER_KEY environment variable in production');
    console.log('Example: export MASTER_KEY="' + generated + '"\n');

    const userKey = readlineSync('Enter master key (or press Enter to use generated): ');
    return userKey.trim() || generated;
  }

  private encryptSecret(plaintext: string): string {
    const iv = randomBytes(16);
    const key = createHash('sha256').update(this.masterKey).digest();

    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  setupSecrets(): void {
    const secrets = [
      {
        key: 'DB_PASSWORD',
        description: 'Database password',
        example: 'your_secure_db_password_here'
      },
      {
        key: 'JWT_SECRET',
        description: 'JWT signing secret (min 32 chars)',
        example: randomBytes(32).toString('hex')
      },
      {
        key: 'SESSION_SECRET',
        description: 'Session secret (min 32 chars)',
        example: randomBytes(32).toString('hex')
      },
      {
        key: 'N8N_URL',
        description: 'N8N webhook URL',
        example: 'https://your-n8n-instance.com/webhook'
      }
    ];

    const secretsDir = './secrets';
    if (!existsSync(secretsDir)) {
      mkdirSync(secretsDir, { recursive: true });
    }

    console.log('\n📝 Enter your secrets (they will be encrypted):');
    console.log('================================================\n');

    secrets.forEach(({ key, description, example }) => {
      console.log(`${key}: ${description}`);
      console.log(`Example: ${example}`);

      const value = readlineSync(`Enter ${key}: `);
      if (value.trim()) {
        const encrypted = this.encryptSecret(value.trim());
        writeFileSync(`${secretsDir}/${key.toLowerCase()}`, encrypted);
        console.log(`✅ ${key} encrypted and saved\n`);
      } else {
        console.log(`⚠️  Skipped ${key}\n`);
      }
    });

    console.log('🎉 Secrets setup complete!');
    console.log('\nNext steps:');
    console.log('1. Copy the secrets/ directory to your production server');
    console.log('2. Set MASTER_KEY environment variable');
    console.log('3. Mount secrets as Docker volumes or copy to /run/secrets/');
    console.log('\nSecurity note: Keep the master key separate from the encrypted files!');
  }
}

// Simple readline implementation without external dependencies
function readlineSync(prompt: string): string {
  process.stdout.write(prompt);

  const fd = process.stdin.fd;
  const buffer = Buffer.alloc(1);
  let input = '';

  while (true) {
    const bytesRead = require('fs').readSync(fd, buffer, 0, 1, null);
    if (bytesRead === 0) break;

    const char = buffer.toString();
    if (char === '\n' || char === '\r') break;

    input += char;
  }

  return input;
}

// Run the setup
if (require.main === module) {
  const setup = new SecretsSetup();
  setup.setupSecrets();
}