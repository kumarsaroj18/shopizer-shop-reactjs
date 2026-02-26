#!/bin/bash

# Shopizer React - Artifact Download and Deploy Script
# Usage: ./download-and-deploy.sh [BUILD_NUMBER] [ARTIFACT_TYPE]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="YOUR_GITHUB_USERNAME/shopizer-shop-reactjs"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
BUILD_NUMBER="${1:-latest}"
ARTIFACT_TYPE="${2:-build}"
DEPLOY_DIR="./deployed"

echo -e "${GREEN}=== Shopizer React Artifact Downloader ===${NC}"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI authenticated${NC}"
echo ""

# Get latest workflow run if BUILD_NUMBER is "latest"
if [ "$BUILD_NUMBER" = "latest" ]; then
    echo "Fetching latest successful workflow run..."
    RUN_ID=$(gh run list --repo "$GITHUB_REPO" --workflow=ci-cd.yml --status=success --limit=1 --json databaseId --jq '.[0].databaseId')
    
    if [ -z "$RUN_ID" ]; then
        echo -e "${RED}Error: No successful workflow runs found${NC}"
        exit 1
    fi
    
    # Get build number from run
    BUILD_NUMBER=$(gh run view "$RUN_ID" --repo "$GITHUB_REPO" --json number --jq '.number')
    echo -e "${GREEN}Latest build number: $BUILD_NUMBER${NC}"
else
    # Find run by build number
    echo "Searching for build #$BUILD_NUMBER..."
    RUN_ID=$(gh run list --repo "$GITHUB_REPO" --workflow=ci-cd.yml --limit=100 --json databaseId,number --jq ".[] | select(.number==$BUILD_NUMBER) | .databaseId")
    
    if [ -z "$RUN_ID" ]; then
        echo -e "${RED}Error: Build #$BUILD_NUMBER not found${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Found workflow run ID: $RUN_ID${NC}"
echo ""

# Determine artifact name based on type
case "$ARTIFACT_TYPE" in
    build)
        ARTIFACT_NAME="shopizer-react-build-$BUILD_NUMBER"
        ;;
    release)
        ARTIFACT_NAME="shopizer-react-release-$BUILD_NUMBER"
        ;;
    docker)
        ARTIFACT_NAME="shopizer-react-docker-$BUILD_NUMBER"
        ;;
    coverage)
        ARTIFACT_NAME="test-coverage-$BUILD_NUMBER"
        ;;
    *)
        echo -e "${RED}Error: Invalid artifact type: $ARTIFACT_TYPE${NC}"
        echo "Valid types: build, release, docker, coverage"
        exit 1
        ;;
esac

echo "Downloading artifact: $ARTIFACT_NAME"
echo ""

# Create deploy directory
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Download artifact
if gh run download "$RUN_ID" --repo "$GITHUB_REPO" --name "$ARTIFACT_NAME"; then
    echo ""
    echo -e "${GREEN}✓ Artifact downloaded successfully${NC}"
else
    echo -e "${RED}Error: Failed to download artifact${NC}"
    exit 1
fi

# Handle different artifact types
case "$ARTIFACT_TYPE" in
    build)
        echo ""
        echo -e "${GREEN}Build artifacts ready in: $DEPLOY_DIR/$ARTIFACT_NAME${NC}"
        echo ""
        echo "To serve the application:"
        echo "  cd $DEPLOY_DIR/$ARTIFACT_NAME"
        echo "  npx serve -s . -p 3000"
        ;;
    release)
        echo ""
        echo "Extracting release package..."
        tar -xzf "shopizer-react-$BUILD_NUMBER.tar.gz"
        rm "shopizer-react-$BUILD_NUMBER.tar.gz"
        echo -e "${GREEN}✓ Release extracted${NC}"
        echo ""
        echo "To serve the application:"
        echo "  cd $DEPLOY_DIR"
        echo "  npx serve -s . -p 3000"
        ;;
    docker)
        echo ""
        echo "Loading Docker image..."
        docker load < "shopizer-react-docker-$BUILD_NUMBER.tar.gz"
        echo -e "${GREEN}✓ Docker image loaded${NC}"
        echo ""
        echo "To run the container:"
        echo "  docker run -p 80:80 shopizer-shop-reactjs:$BUILD_NUMBER"
        ;;
    coverage)
        echo ""
        echo -e "${GREEN}Test coverage reports ready in: $DEPLOY_DIR/$ARTIFACT_NAME${NC}"
        echo ""
        echo "To view coverage report:"
        echo "  open $DEPLOY_DIR/$ARTIFACT_NAME/lcov-report/index.html"
        ;;
esac

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
