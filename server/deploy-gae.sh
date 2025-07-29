#!/bin/bash

# Google App Engine Deployment Script for Doom Protocol Server
# This script builds and deploys the server to Google App Engine

set -e  # Exit on any error

echo "🔥 Starting Doom Protocol Server deployment to Google App Engine..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK is not installed. Please install it first."
    print_error "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_error "You are not authenticated with Google Cloud."
    print_error "Run: gcloud auth login"
    exit 1
fi

# Parse command line arguments
ENVIRONMENT="production"
PROMOTE="true"

while [[ $# -gt 0 ]]; do
    case $1 in
        --staging)
            ENVIRONMENT="staging"
            PROMOTE="false"
            shift
            ;;
        --no-promote)
            PROMOTE="false"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--staging] [--no-promote]"
            echo "  --staging    Deploy to staging environment (no promotion)"
            echo "  --no-promote Don't promote this version to receive traffic"
            exit 0
            ;;
        *)
            print_error "Unknown option $1"
            exit 1
            ;;
    esac
done

print_status "Deployment environment: $ENVIRONMENT"

# Build the project
print_status "Building TypeScript project..."
if ! npm run build; then
    print_error "Build failed. Please fix build errors and try again."
    exit 1
fi

print_status "Build completed successfully ✅"

# Backup original package.json and use production version
print_status "Preparing production package.json..."
cp package.json package.json.bak
cp package.gae.json package.json

# Prepare deployment command
DEPLOY_CMD="gcloud app deploy app.yaml --quiet"

if [[ "$ENVIRONMENT" == "staging" ]]; then
    DEPLOY_CMD="$DEPLOY_CMD --version staging"
fi

if [[ "$PROMOTE" == "false" ]]; then
    DEPLOY_CMD="$DEPLOY_CMD --no-promote"
fi

# Show deployment info
print_status "Deployment configuration:"
echo "  - Environment: $ENVIRONMENT"
echo "  - Promote to live traffic: $PROMOTE"
echo "  - Command: $DEPLOY_CMD"

# Confirm deployment
read -p "Continue with deployment? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled."
    exit 0
fi

# Deploy to App Engine
print_status "Deploying to Google App Engine..."
if eval "$DEPLOY_CMD"; then
    print_status "Deployment completed successfully! 🎉"
    
    # Get project ID
    PROJECT_ID=$(gcloud config get-value project)
    
    if [[ "$PROMOTE" == "true" ]]; then
        echo
        print_status "Your server is now live at:"
        echo "  https://doom-server-dot-$PROJECT_ID.appspot.com"
    else
        VERSION_ID=$(gcloud app versions list --service=doom-server --limit=1 --sort-by=~creation_time --format="value(id)")
        echo
        print_status "Your server is deployed but not promoted. Access it at:"
        echo "  https://$VERSION_ID-dot-doom-server-dot-$PROJECT_ID.appspot.com"
        echo
        print_warning "To promote this version to live traffic, run:"
        echo "  gcloud app services set-traffic doom-server --splits $VERSION_ID=1"
    fi
    
    echo
    print_status "Useful commands:"
    echo "  View logs:     npm run gae:logs"
    echo "  Open browser:  npm run gae:browse"
    echo "  Check health:  curl https://doom-server-dot-$PROJECT_ID.appspot.com/health"
    
else
    print_error "Deployment failed. Check the error messages above."
    # Restore original package.json on failure
    if [ -f package.json.bak ]; then
        mv package.json.bak package.json
        print_status "Restored original package.json"
    fi
    exit 1
fi

# Restore original package.json after deployment
print_status "Restoring original package.json..."
if [ -f package.json.bak ]; then
    mv package.json.bak package.json
    print_status "Original package.json restored ✅"
fi 