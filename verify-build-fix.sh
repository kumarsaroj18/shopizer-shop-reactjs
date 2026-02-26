#!/bin/bash

echo "=== Build Warnings Fix Verification ==="
echo ""

# Check Sass version
echo "✓ Checking Sass version..."
SASS_VERSION=$(npm list sass --depth=0 2>/dev/null | grep sass@ | sed 's/.*sass@//' | sed 's/ .*//')
echo "  Current version: $SASS_VERSION"

if [[ "$SASS_VERSION" == "1.32.13" ]]; then
    echo "  ✅ Correct version (1.32.13)"
else
    echo "  ❌ Wrong version (expected 1.32.13)"
    echo "  Run: npm install --save-dev sass@1.32.13 --legacy-peer-deps"
fi

echo ""

# Check package.json
echo "✓ Checking package.json..."
if grep -q '"sass": "\^1.32.13"' package.json; then
    echo "  ✅ package.json has correct Sass version"
else
    echo "  ❌ package.json doesn't have correct Sass version"
fi

echo ""

# Check if .sassrc.js exists (should not)
echo "✓ Checking for unnecessary config files..."
if [ -f ".sassrc.js" ]; then
    echo "  ⚠️  .sassrc.js exists (should be removed)"
else
    echo "  ✅ No .sassrc.js file"
fi

echo ""

# Check browserslist
echo "✓ Checking browserslist database..."
CANIUSE_VERSION=$(npm list caniuse-lite --depth=0 2>/dev/null | grep caniuse-lite@ | sed 's/.*caniuse-lite@//' | sed 's/ .*//')
echo "  Current version: $CANIUSE_VERSION"
if [[ "$CANIUSE_VERSION" > "1.0.30001700" ]]; then
    echo "  ✅ Browserslist database is up to date"
else
    echo "  ⚠️  Browserslist may be outdated"
    echo "  Run: npx browserslist@latest --update-db"
fi

echo ""
echo "=== Verification Complete ==="
echo ""
echo "To test the fix:"
echo "  1. Stop any running dev server"
echo "  2. Run: npm run dev"
echo "  3. Check for warnings in the output"
echo ""
echo "Expected result: No Sass deprecation warnings"
