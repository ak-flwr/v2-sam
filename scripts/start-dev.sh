#!/bin/bash
echo "=========================================="
echo "  SAM v2 - Development Server Startup"
echo "  Version: 2.3.3"
echo "=========================================="

# Check Node
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found"
    exit 1
fi

# Check .env
if [ ! -f .env ]; then
    echo "ERROR: .env file not found"
    exit 1
fi

echo "Checking database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "WARNING: Database not responding. It may need to wake up."
fi

echo ""
echo "Starting development server..."
npm run dev
