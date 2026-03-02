# Shopizer React Shop — Docker Build Guide

This directory contains two Dockerfiles for building the Shopizer React storefront as a Docker image, plus helper scripts to build and run them without manual ceremony.

## Overview

| File | Purpose |
|---|---|
| `Dockerfile.ci` | Builds image from React build downloaded from GitHub Actions CI |
| `Dockerfile.local` | Builds image from a locally compiled React build |
| `build-image-from-ci.sh` | Downloads CI artifact and builds Docker image using `Dockerfile.ci` |
| `run-local.sh` | Runs the shop with your choice of source (docker / build / local) |

---

## Dockerfile.local — Local Build

Packages a locally compiled React `build/` directory into an nginx image. Use this when you need to build from source without pushing to CI first.

### Prerequisites

- Docker
- Node.js 16+ and npm

### Steps

```bash
cd shopizer-shop-reactjs

# 1. Install dependencies (first time or after package.json changes)
npm ci --legacy-peer-deps

# 2. Build the React app
CI=false npm run build
# Output: build/

# 3. Build the Docker image
docker build -f Dockerfile.local -t shopizer-shop-reactjs:local .

# 4. Run it
docker run -p 3000:80 \
  -e APP_BASE_URL=http://localhost:8080 \
  -e APP_MERCHANT=DEFAULT \
  shopizer-shop-reactjs:local
```

Open [http://localhost:3000](http://localhost:3000)

### Pros ✅
- No external dependencies — fully self-contained
- Works offline after `node_modules` is cached
- Full control over the build

### Cons ❌
- React build takes 2–5 minutes
- Requires Node.js locally

---

## Dockerfile.ci — GitHub Actions CI Artifact

Packages the React `build/` produced by GitHub Actions CI into an nginx image. The `build-image-from-ci.sh` script handles downloading and caching the artifact automatically.

### Prerequisites

- Docker
- `gh` CLI installed and authenticated
- The CI workflow (`ci-cd.yml`) has completed at least one successful run

### Install and authenticate gh CLI

```bash
# macOS
brew install gh

# Linux (Ubuntu/Debian)
sudo apt install gh

# Authenticate
gh auth login
```

### Option A — Using build-image-from-ci.sh (recommended)

```bash
cd shopizer-shop-reactjs
chmod +x build-image-from-ci.sh

./build-image-from-ci.sh <github-owner> <github-repo> [branch] [image-tag]
```

**Examples:**

```bash
# Basic (uses main branch, tag shopizer-shop-reactjs:ci-latest)
./build-image-from-ci.sh kumarsaroj18 shopizer-shop-reactjs

# Specify branch
./build-image-from-ci.sh kumarsaroj18 shopizer-shop-reactjs develop

# Specify custom image tag
./build-image-from-ci.sh kumarsaroj18 shopizer-shop-reactjs main shopizer-shop:v3.0.0

# Organisation repo
./build-image-from-ci.sh myorg shopizer-shop-reactjs main myorg/shopizer-shop:latest
```

The script:
1. Finds the latest successful CI run on the given branch
2. Downloads the `shopizer-react-release-*` artifact (skips download if already cached)
3. Extracts the React build tarball into `.ci-download/shopizer-react/build/`
4. Runs `docker build -f Dockerfile.ci -t <image-tag> .`
5. Cleans up the build directory (cache file is kept to avoid re-downloading on the next run)

### Option B — Manual

```bash
cd shopizer-shop-reactjs

# Download the release artifact (contains a shopizer-react-*.tar.gz)
gh run download <RUN_ID> \
  --repo kumarsaroj18/shopizer-shop-reactjs \
  --pattern "shopizer-react-release-*" \
  --dir .ci-download/

tar -xzf .ci-download/shopizer-react-*.tar.gz -C .ci-download/shopizer-react/build/

docker build -f Dockerfile.ci -t shopizer-shop-reactjs:ci-latest .
```

### Run the CI-built image

```bash
docker run -p 3000:80 \
  -e APP_BASE_URL=http://localhost:8080 \
  -e APP_MERCHANT=DEFAULT \
  shopizer-shop-reactjs:ci-latest
```

### Pros ✅
- Fast: no npm install, no React compilation
- Uses the exact same artifact as CI/CD (tested = deployed)
- Artifact download is cached — rebuilds are near-instant

### Cons ❌
- Requires `gh` CLI and GitHub authentication
- CI must have run at least once

---

## run-local.sh — Quick Runner

Starts the React shop without manually managing Docker images. Three modes are available.

### Usage

```bash
cd shopizer-shop-reactjs
chmod +x run-local.sh

./run-local.sh [OPTIONS]

Options:
  --mode docker       Pull from ghcr.io and run (default)
  --mode build        Download CI artifact and run in nginx container
  --mode local        Build from source (npm run build) and run
  --owner <name>      GitHub owner (auto-detected from git remote)
  --tag <tag>         Docker image tag for --mode docker (default: latest)
  --backend <url>     Shopizer backend URL (default: http://localhost:8080)
  --merchant <id>     Merchant store code (default: DEFAULT)
  --help              Show help
```

### Mode: docker (default)

Pulls the latest image from GitHub Container Registry and runs it.

```bash
# Auto-detect owner from git remote
./run-local.sh

# Explicit owner + custom backend
./run-local.sh --owner kumarsaroj18 --backend http://192.168.1.10:8080

# Different merchant store
./run-local.sh --owner kumarsaroj18 --merchant ELECTRONICS

# Specific image tag
./run-local.sh --owner kumarsaroj18 --tag v3.0.0
```

### Mode: build

Downloads the React build from the latest successful CI run and serves it via nginx. No image build step required.

```bash
./run-local.sh --mode build

# With custom backend and merchant
./run-local.sh --mode build \
  --backend http://staging.mycompany.com:8080 \
  --merchant FASHION
```

### Mode: local

Installs dependencies, runs `npm run build`, builds `shopizer-shop-reactjs:local`, and starts it.

```bash
./run-local.sh --mode local

# Connect to a remote backend
./run-local.sh --mode local --backend http://api.mycompany.com
```

### Environment Variables passed at runtime

All variables are read by `env.sh` at container start, which regenerates `env-config.js`. Defaults come from the `.env` file baked into the image; any `-e` flag overrides them.

| Variable | Default | Description |
|---|---|---|
| `APP_BASE_URL` | `http://localhost:8080` | Shopizer backend base URL |
| `APP_API_VERSION` | `/api/v1/` | API version path |
| `APP_MERCHANT` | `DEFAULT` | Merchant store code |
| `APP_PRODUCTION` | `false` | Production mode flag |
| `APP_PRODUCT_GRID_LIMIT` | `15` | Products per page |
| `APP_MAP_API_KEY` | _(empty)_ | Google Maps API key |
| `APP_PAYMENT_TYPE` | `STRIPE` | Payment provider |
| `APP_STRIPE_KEY` | _(empty)_ | Stripe publishable key |
| `APP_THEME_COLOR` | `#D1D1D1` | Primary theme colour |

---

## Runtime Environment Configuration

`env.sh` is executed at container start. It iterates over `.env` key names, checks for shell env vars of those names (set via `-e`), and writes them into `env-config.js` which the React app loads at page load time.

This means **no rebuild is needed** to point the same image at a different backend:

```bash
# Development
docker run -p 3000:80 \
  -e APP_BASE_URL=http://localhost:8080 \
  -e APP_MERCHANT=DEFAULT \
  shopizer-shop-reactjs:ci-latest

# Staging
docker run -p 3000:80 \
  -e APP_BASE_URL=https://staging-api.mycompany.com \
  -e APP_MERCHANT=STAGING \
  -e APP_STRIPE_KEY=pk_test_xxxx \
  shopizer-shop-reactjs:ci-latest

# Production (with Stripe + Maps)
docker run -p 80:80 \
  -e APP_BASE_URL=https://api.mycompany.com \
  -e APP_MERCHANT=DEFAULT \
  -e APP_PRODUCTION=true \
  -e APP_STRIPE_KEY=pk_live_xxxx \
  -e APP_MAP_API_KEY=AIzaSyXXXX \
  shopizer-shop-reactjs:ci-latest
```

---

## Docker Compose example

```yaml
services:
  shopizer-shop:
    image: shopizer-shop-reactjs:ci-latest
    ports:
      - "3000:80"
    environment:
      - APP_BASE_URL=http://shopizer-backend:8080
      - APP_API_VERSION=/api/v1/
      - APP_MERCHANT=DEFAULT
      - APP_PAYMENT_TYPE=STRIPE
      - APP_STRIPE_KEY=pk_test_xxxx
    depends_on:
      - shopizer-backend
```

---

## Running the full stack locally

```bash
# 1 — Start backend + MySQL
cd ../shopizer
./run-local.sh          # defaults: docker mode, port 8080

# 2 — Start admin UI (separate terminal)
cd ../shopizer-admin
./run-local.sh          # defaults: docker mode, port 4200

# 3 — Start React shop (separate terminal)
cd ../shopizer-shop-reactjs
./run-local.sh          # defaults: docker mode, port 3000
```

| Service | URL |
|---|---|
| React Shop | http://localhost:3000 |
| Admin UI | http://localhost:4200 |
| Backend API | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
