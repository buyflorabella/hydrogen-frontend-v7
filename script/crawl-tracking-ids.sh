#!/bin/bash
#
# crawl-tracking-ids.sh
# Crawl a website and identify analytics tracking IDs
#
# Usage:
#   ./crawl-tracking-ids.sh <site-url>
#
# Examples:
#   ./crawl-tracking-ids.sh https://buyflorabella.com
#   ./crawl-tracking-ids.sh https://dev1-frontend.textreader.boardmansgame.com
#
# What it detects:
#   - Google Analytics GA4 (G-XXXXXXXX)
#   - Google Analytics Universal (UA-XXXXXXXX)
#   - Microsoft Clarity (clarity project IDs)
#   - Google Tag Manager (GTM-XXXXXXX)
#   - Facebook Pixel
#   - Hotjar
#

set -e

SITE_URL="${1:-}"

if [ -z "$SITE_URL" ]; then
    echo "Usage: $0 <site-url>"
    echo "Example: $0 https://buyflorabella.com"
    exit 1
fi

# Remove trailing slash
SITE_URL="${SITE_URL%/}"

echo "=========================================="
echo "Crawling: $SITE_URL"
echo "=========================================="
echo ""

# Fetch the page HTML
HTML=$(curl -sL "$SITE_URL")

echo "--- Google Analytics GA4 (G-XXXXXXXX) ---"
echo "$HTML" | grep -oE 'G-[A-Z0-9]{8,12}' | sort -u || echo "  (none found)"
echo ""

echo "--- Google Analytics Universal (UA-XXXXXXXX) ---"
echo "$HTML" | grep -oE 'UA-[0-9]+-[0-9]+' | sort -u || echo "  (none found)"
echo ""

echo "--- Google Tag Manager (GTM-XXXXXXX) ---"
echo "$HTML" | grep -oE 'GTM-[A-Z0-9]+' | sort -u || echo "  (none found)"
echo ""

echo "--- Microsoft Clarity ---"
if echo "$HTML" | grep -q 'clarity.ms'; then
    echo "  Clarity detected!"
    echo "$HTML" | grep -oE 'clarity\.ms/tag/[a-z0-9]+' | sed 's/clarity.ms\/tag\//  Project ID: /' | sort -u
else
    echo "  (none found)"
fi
echo ""

echo "--- Facebook Pixel ---"
echo "$HTML" | grep -oE 'fbq\s*\(\s*.init.\s*,\s*.[0-9]+' | grep -oE '[0-9]{10,}' | sort -u || echo "  (none found)"
echo ""

echo "--- Hotjar ---"
if echo "$HTML" | grep -q 'hotjar'; then
    echo "  Hotjar detected!"
    echo "$HTML" | grep -oE 'hjid:[0-9]+' | sort -u || echo "$HTML" | grep -oE 'h\.hotjar\.com' | head -1
else
    echo "  (none found)"
fi
echo ""

echo "=========================================="
echo "Local codebase search"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "--- Searching in: $PROJECT_ROOT ---"
echo ""

echo "Files containing GA4 IDs (G-XXXXXXXX):"
grep -rl --include="*.js" --include="*.ts" --include="*.tsx" --include="*.html" --exclude-dir="node_modules" --exclude-dir=".cache" --exclude-dir="dist" 'G-[A-Z0-9]\{8,12\}' "$PROJECT_ROOT" 2>/dev/null || echo "  (none found)"
echo ""

echo "Files containing Clarity:"
grep -rl --include="*.js" --include="*.ts" --include="*.tsx" --include="*.html" --exclude-dir="node_modules" --exclude-dir=".cache" --exclude-dir="dist" 'clarity.ms' "$PROJECT_ROOT" 2>/dev/null || echo "  (none found)"
echo ""

echo "Files containing GTM:"
grep -rl --include="*.js" --include="*.ts" --include="*.tsx" --include="*.html" --exclude-dir="node_modules" --exclude-dir=".cache" --exclude-dir="dist" 'GTM-[A-Z0-9]' "$PROJECT_ROOT" 2>/dev/null || echo "  (none found)"
echo ""

echo "Done."
