#!/bin/bash

# Example: Complete workflow to download and run the application
# This script demonstrates the entire process

set -e

echo "=== Shopizer React - Complete Deployment Example ==="
echo ""

# Step 1: Download latest build
echo "Step 1: Downloading latest build..."
./scripts/download-and-deploy.sh latest build

# Step 2: Find the downloaded build directory
BUILD_DIR=$(ls -td deployed/shopizer-react-build-* 2>/dev/null | head -1)

if [ -z "$BUILD_DIR" ]; then
    echo "Error: Build directory not found"
    exit 1
fi

echo "Found build: $BUILD_DIR"
echo ""

# Step 3: Configure backend URL (optional)
echo "Step 2: Configuring backend URL..."
if [ -f "$BUILD_DIR/env-config.js" ]; then
    # Backup original
    cp "$BUILD_DIR/env-config.js" "$BUILD_DIR/env-config.js.bak"
    
    # Update backend URL (customize as needed)
    sed -i.tmp 's|APP_BASE_URL: ".*"|APP_BASE_URL: "http://localhost:8080"|g' "$BUILD_DIR/env-config.js"
    rm "$BUILD_DIR/env-config.js.tmp"
    
    echo "✓ Backend URL configured"
else
    echo "⚠ env-config.js not found, skipping configuration"
fi
echo ""

# Step 4: Check if serve is installed
echo "Step 3: Checking dependencies..."
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found. Please install Node.js"
    exit 1
fi
echo "✓ npx is available"
echo ""

# Step 5: Start the application
echo "Step 4: Starting application..."
echo ""
echo "=========================================="
echo "Application will be available at:"
echo "  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

cd "$BUILD_DIR"
npx serve -s . -p 3000
