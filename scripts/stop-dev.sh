#!/bin/bash
echo "=========================================="
echo "  SAM v2 - Stopping Development Server"
echo "=========================================="

# Find and kill Next.js dev server
PID=$(lsof -ti:3000)
if [ -n "$PID" ]; then
    echo "Stopping process on port 3000 (PID: $PID)..."
    kill -9 $PID
    echo "Server stopped."
else
    echo "No server running on port 3000."
fi

# Also kill any prisma studio
PRISMA_PID=$(lsof -ti:5555)
if [ -n "$PRISMA_PID" ]; then
    echo "Stopping Prisma Studio (PID: $PRISMA_PID)..."
    kill -9 $PRISMA_PID
fi

echo "Shutdown complete."
