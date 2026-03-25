// Usage example for SecureConfig in your NestJS application
// Replace direct process.env usage with secure config

import { SecureConfig } from './secure-config';

export class ConfigService {
  private secureConfig = SecureConfig.getInstance();

  // Database configuration
  get databaseConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: this.secureConfig.getSecret('DB_PASSWORD'),
      database: process.env.DB_NAME || 'altos_de_viedma',
    };
  }

  // JWT configuration
  get jwtConfig() {
    return {
      secret: this.secureConfig.getSecret('JWT_SECRET'),
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    };
  }

  // Session configuration
  get sessionConfig() {
    return {
      secret: this.secureConfig.getSecret('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    };
  }

  // Webhook configuration
  get webhookConfig() {
    return {
      n8nUrl: this.secureConfig.getSecret('N8N_URL'),
    };
  }
}