#!/bin/bash
set -e  # Exit on any error

echo "=== Starting build process ==="
pwd
ls -la

# Check if React app is at root level (has src/ and public/)
if [ -d "src" ] && [ -d "public" ] && [ -f "src/index.js" ]; then
    echo "✓ Found React code at root level"
    echo "Copying React files from root to client/ directory..."
    
    # Ensure client directory structure exists
    mkdir -p client/src client/public
    
    # Copy all React source files
    echo "Copying src/ to client/src/..."
    cp -r src/* client/src/ 2>/dev/null || true
    
    # Copy public files
    echo "Copying public/ to client/public/..."
    cp -r public/* client/public/ 2>/dev/null || true
    
    echo "✓ Files copied to client/"
fi

# Verify client has package.json
if [ ! -f "client/package.json" ]; then
    echo "ERROR: client/package.json not found!"
    exit 1
fi

# Build from client directory
echo "Step 1: Installing client dependencies..."
cd client
pwd
ls -la package.json || echo "WARNING: package.json check failed"
npm install

echo "Step 2: Building client application..."
npm run build

# Verify build was created
if [ ! -d "build" ]; then
    echo "ERROR: Build directory not created in client/"
    exit 1
fi

echo "✓ Client build completed"
cd ..

echo "Step 3: Installing backend dependencies..."
cd backend
npm install
cd ..

echo "=== Build completed successfully! ==="
echo "✓ client/build directory ready for backend to serve"
ls -la client/build/ | head -5

