#!/bin/bash

# Doom Protocol Server PM2 Startup Script
echo "Starting Doom Protocol Server with PM2..."

# Build the TypeScript code
echo "Building TypeScript..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful. Starting server with PM2..."
    
    # Start the server with PM2
    npm run pm2:start
    
    # Show status
    echo "Server started! You can monitor it with:"
    echo "  npm run pm2:logs    - View logs"
    echo "  npm run pm2:monit   - Monitor processes"
    echo "  npm run pm2:stop    - Stop server"
    echo "  npm run pm2:restart - Restart server"
    
else
    echo "Build failed. Please fix the errors and try again."
    exit 1
fi 