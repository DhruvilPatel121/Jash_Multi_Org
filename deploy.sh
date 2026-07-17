#!/bin/bash

echo "🚀 Jash Physiotherapy App - Deployment Script"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create .env file with your Firebase credentials"
    echo "   Run: cp .env.example .env"
    echo "   Then edit .env with your Firebase config"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Build the app
echo "🔨 Building the app..."
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📱 Your app is ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Firebase Hosting:"
    echo "   firebase deploy --only hosting"
    echo ""
    echo "2. Or deploy to Vercel:"
    echo "   vercel --prod"
    echo ""
    echo "3. Or deploy to Netlify:"
    echo "   netlify deploy --prod --dir=dist"
    echo ""
    echo "📖 See MOBILE_APP_GUIDE.md for detailed instructions"
else
    echo "❌ Build failed!"
    echo "Please check the error messages above"
    exit 1
fi
