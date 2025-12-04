#!/bin/bash
set -e  # Exit on any error

echo "=== Starting build process ==="
pwd
ls -la

# Verify client structure before building
echo "Verifying client directory structure..."
if [ ! -d "client/src" ]; then
    echo "ERROR: client/src directory not found!"
    echo "Please ensure src/ folder is inside client/ directory"
    exit 1
fi

if [ ! -d "client/public" ]; then
    echo "ERROR: client/public directory not found!"
    echo "Please ensure public/ folder is inside client/ directory"
    exit 1
fi

if [ ! -f "client/package.json" ]; then
    echo "ERROR: client/package.json not found!"
    exit 1
fi

echo "✓ Client directory structure verified"
ls -la client/ | head -10

# Build from client directory
echo "Step 1: Installing client dependencies..."
cd client
npm install

echo "Step 2: Building client application..."
npm run build

# Verify build was created
if [ ! -d "build" ]; then
    echo "ERROR: Build directory not created in client/"
    exit 1
fi

echo "✓ Client build completed"
ls -la build/ | head -5
cd ..

echo "Step 3: Installing backend dependencies..."
cd backend
npm install
cd ..

echo "=== Build completed successfully! ==="
echo "✓ client/build directory ready for backend to serve"
ls -la client/build/ | head -5