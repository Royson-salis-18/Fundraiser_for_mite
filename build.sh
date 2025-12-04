#!/bin/bash
set -e  # Exit on any error

echo "=== Starting build process ==="
pwd
ls -la

echo "Step 1: Installing client dependencies..."
cd client
pwd
ls -la package.json
npm install

echo "Step 2: Building client application..."
npm run build
ls -la build/ || echo "Build directory not found!"

echo "Step 3: Installing backend dependencies..."
cd ../backend
pwd
npm install

cd ..
echo "=== Build completed successfully! ==="

