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

# Verify client has package.json, create it if missing
if [ ! -f "client/package.json" ]; then
    echo "WARNING: client/package.json not found! Creating it..."
    mkdir -p client
    cat > client/package.json << 'EOF'
{
  "name": "client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "mongodb": "^7.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.5",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF
    echo "✓ Created client/package.json"
fi

# Verify client structure before building
echo "Verifying client directory structure..."
ls -la client/ | head -10
if [ ! -d "client/src" ]; then
    echo "ERROR: client/src directory not found!"
    exit 1
fi
if [ ! -d "client/public" ]; then
    echo "ERROR: client/public directory not found!"
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

