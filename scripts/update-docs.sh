#!/bin/bash
echo "Updating all documentation to reflect v2.3.3 state..."

# List of MD files to review
MD_FILES=$(find . -name "*.md" -not -path "./node_modules/*" -not -path "./.next/*")

echo "Found MD files:"
echo "$MD_FILES"

echo ""
echo "Each file needs review for:"
echo "1. Version references (should mention v2.3.x)"
echo "2. Feature accuracy (conversation lifecycle, latency, Arabic-first)"
echo "3. API endpoints (including new /api/tts, /api/admin/analytics/*)"
echo "4. Architecture (state machine, split response pattern)"
