#!/bin/bash
# Production Deployment Script - Secure Secrets Management
# No external dependencies, uses only system tools

set -euo pipefail

echo "🚀 Altos de Viedma - Secure Production Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="altos-de-viedma"
SECRETS_DIR="/run/secrets"
BACKUP_DIR="/opt/backups"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."

    # Check if running as root (for Docker setup)
    if [[ $EUID -eq 0 ]]; then
        log_warn "Running as root. This is OK for Docker setup."
    fi

    # Check required commands
    local required_commands=("docker" "openssl" "base64")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command '$cmd' not found"
            exit 1
        fi
    done

    log_info "✅ All requirements met"
}

setup_secrets_directory() {
    log_info "Setting up secrets directory..."

    # Create secrets directory with proper permissions
    sudo mkdir -p "$SECRETS_DIR"
    sudo chmod 700 "$SECRETS_DIR"

    # Create backup directory
    sudo mkdir -p "$BACKUP_DIR"
    sudo chmod 755 "$BACKUP_DIR"

    log_info "✅ Secrets directory created: $SECRETS_DIR"
}

generate_master_key() {
    if [[ -z "${MASTER_KEY:-}" ]]; then
        log_warn "MASTER_KEY not set. Generating new one..."

        # Generate cryptographically secure master key
        MASTER_KEY=$(openssl rand -hex 32)

        echo "🔑 Generated Master Key: $MASTER_KEY"
        echo ""
        echo "⚠️  IMPORTANT: Save this master key securely!"
        echo "   Add to your environment: export MASTER_KEY=\"$MASTER_KEY\""
        echo "   Or add to your deployment configuration"
        echo ""

        read -p "Press Enter to continue after saving the master key..."
    else
        log_info "✅ Using existing MASTER_KEY"
    fi
}

setup_production_secrets() {
    log_info "Setting up production secrets..."

    # List of required secrets
    local secrets=(
        "db_password:Database password"
        "jwt_secret:JWT signing secret"
        "session_secret:Session secret"
        "n8n_url:N8N webhook URL"
    )

    for secret_info in "${secrets[@]}"; do
        IFS=':' read -r secret_name description <<< "$secret_info"

        echo ""
        echo "Setting up: $description"
        echo "Secret name: $secret_name"

        # Check if secret already exists
        if [[ -f "$SECRETS_DIR/$secret_name" ]]; then
            log_warn "Secret $secret_name already exists. Skipping..."
            continue
        fi

        # Generate or prompt for secret value
        case "$secret_name" in
            "jwt_secret"|"session_secret")
                # Generate cryptographically secure secrets
                secret_value=$(openssl rand -hex 32)
                log_info "Generated secure $secret_name"
                ;;
            *)
                # Prompt for user input
                read -s -p "Enter $description: " secret_value
                echo ""
                ;;
        esac

        if [[ -n "$secret_value" ]]; then
            # Encrypt and store secret
            encrypted_secret=$(echo -n "$secret_value" | openssl enc -aes-256-cbc -a -salt -pass pass:"$MASTER_KEY")
            echo "$encrypted_secret" | sudo tee "$SECRETS_DIR/$secret_name" > /dev/null
            sudo chmod 600 "$SECRETS_DIR/$secret_name"

            log_info "✅ Secret $secret_name encrypted and stored"
        else
            log_warn "Skipped empty secret: $secret_name"
        fi
    done
}

create_docker_compose_production() {
    log_info "Creating production docker-compose configuration..."

    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: altos-de-viedma-backend:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MASTER_KEY=${MASTER_KEY}
    volumes:
      - /run/secrets:/run/secrets:ro
    ports:
      - "3010:3010"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3010/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    user: "1001:1001"

  frontend:
    image: altos-de-viedma-frontend:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
      - /var/run

networks:
  default:
    driver: bridge
EOF

    log_info "✅ Production docker-compose.yml created"
}

main() {
    echo ""
    log_info "Starting secure deployment setup..."

    check_requirements
    setup_secrets_directory
    generate_master_key
    setup_production_secrets
    create_docker_compose_production

    echo ""
    log_info "🎉 Deployment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Build your Docker images"
    echo "2. Set MASTER_KEY environment variable"
    echo "3. Run: docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "Security reminders:"
    echo "- Keep the master key separate from the application"
    echo "- Regularly rotate secrets"
    echo "- Monitor access to the secrets directory"
    echo "- Keep backups of encrypted secrets"
}

# Run main function
main "$@"