# Secure Secrets Management Documentation

## Overview
This system provides secure secrets management without external dependencies, preventing supply chain attacks while maintaining security best practices.

## Features
- **Zero External Dependencies**: Uses only Node.js built-ins
- **Encrypted Storage**: Secrets are encrypted using AES-256-CBC
- **Environment Priority**: Environment variables take precedence over encrypted files
- **Production Ready**: Designed for containerized production environments

## Usage

### 1. Setup Secrets (Development/Staging)
```bash
# Run the setup script
npm run setup:secrets

# Or manually with Node.js
node scripts/setup-secrets.ts
```

### 2. Production Deployment
```bash
# Use the production deployment script
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### 3. Environment Variables
Set these environment variables in production:
```bash
export MASTER_KEY="your-32-char-master-key-here"
export NODE_ENV="production"
```

### 4. Docker Integration
The system works with Docker secrets and volumes:
```yaml
volumes:
  - /run/secrets:/run/secrets:ro
environment:
  - MASTER_KEY=${MASTER_KEY}
```

## Security Features

### Encryption
- **Algorithm**: AES-256-CBC
- **Key Derivation**: SHA-256 hash of master key
- **IV**: Random 16-byte initialization vector per secret

### Access Control
- Secrets directory: 700 permissions (owner only)
- Secret files: 600 permissions (owner read/write only)
- Non-root container execution

### Audit Trail
- All secret access is logged
- Failed decryption attempts are recorded
- Environment variable fallbacks are tracked

## File Structure
```
/run/secrets/
├── db_password          # Encrypted database password
├── jwt_secret          # Encrypted JWT signing secret
├── session_secret      # Encrypted session secret
└── n8n_url            # Encrypted N8N webhook URL
```

## Best Practices

1. **Master Key Management**
   - Generate cryptographically secure master keys (32+ chars)
   - Store master key separately from encrypted secrets
   - Rotate master key periodically
   - Never commit master key to version control

2. **Secret Rotation**
   - Rotate secrets regularly (quarterly recommended)
   - Use the setup script to update secrets
   - Test secret rotation in staging first

3. **Monitoring**
   - Monitor secret access patterns
   - Alert on failed decryption attempts
   - Log all secret-related operations

4. **Backup and Recovery**
   - Backup encrypted secrets securely
   - Test recovery procedures regularly
   - Document recovery processes

## Troubleshooting

### Common Issues

**Secret not found error:**
```
Error: Secret JWT_SECRET not found
```
Solution: Ensure environment variable is set or encrypted file exists

**Decryption failed:**
```
Error: Failed to decrypt secret
```
Solution: Verify MASTER_KEY is correct and matches encryption key

**Permission denied:**
```
Error: EACCES: permission denied
```
Solution: Check file permissions on secrets directory and files

### Debug Mode
Enable debug logging:
```bash
export DEBUG_SECRETS=true
```

## Migration from Environment Variables

1. **Identify Current Secrets**
   ```bash
   # List current environment secrets
   env | grep -E "(PASSWORD|SECRET|KEY|URL)" | grep -v MASTER_KEY
   ```

2. **Run Migration Script**
   ```bash
   npm run migrate:secrets
   ```

3. **Verify Migration**
   ```bash
   npm run test:secrets
   ```

## Security Considerations

- **No Network Dependencies**: All operations are local
- **Memory Safety**: Secrets are cleared from memory after use
- **Process Isolation**: Each service gets its own config instance
- **Audit Logging**: All access is logged for security monitoring

## Support

For security issues, contact: security@altosdeviedma.com
For general support, create an issue in the repository.