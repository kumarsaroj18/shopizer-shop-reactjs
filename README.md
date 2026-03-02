# Shopizer React Shop

Bootstrapped with [Create React App](https://github.com/facebook/create-react-app). Tested with **Node v16.13.0**.

## Quick start

### Dev server (no Docker)

```bash
npm install --legacy-peer-deps
npm start              # opens http://localhost:3000
```

Configure the backend URL in `public/env-config.js` or via `.env`.

### Production build

```bash
CI=false npm run build    # output: build/
```

---

## Docker — build & run

Three ways to get a running Docker image. See [DOCKER_BUILD_GUIDE.md](docs/DOCKER_BUILD_GUIDE.md) for full details and examples.

### 1. From CI artifact (fastest)

Downloads the React build from the latest successful GitHub Actions run — no Node.js required locally.

```bash
chmod +x build-image-from-ci.sh
./build-image-from-ci.sh <github-owner> shopizer-shop-reactjs [branch] [image-tag]

# Example
./build-image-from-ci.sh kumarsaroj18 shopizer-shop-reactjs main shopizer-shop-reactjs:ci-latest

docker run -p 3000:80 \
  -e APP_BASE_URL=http://localhost:8080 \
  -e APP_MERCHANT=DEFAULT \
  shopizer-shop-reactjs:ci-latest
```

### 2. From local source (Dockerfile.local)

```bash
CI=false npm run build
docker build -f Dockerfile.local -t shopizer-shop-reactjs:local .
docker run -p 3000:80 \
  -e APP_BASE_URL=http://localhost:8080 \
  -e APP_MERCHANT=DEFAULT \
  shopizer-shop-reactjs:local
```

### 3. run-local.sh — one-command launcher

```bash
chmod +x run-local.sh

./run-local.sh                              # pull from ghcr.io (docker mode)
./run-local.sh --mode build                 # download CI artifact and serve
./run-local.sh --mode local                 # build from source and run
./run-local.sh --backend http://host:8080   # custom backend URL
./run-local.sh --merchant ELECTRONICS       # different store code
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `APP_BASE_URL` | `http://localhost:8080` | Shopizer backend URL |
| `APP_API_VERSION` | `/api/v1/` | API version path |
| `APP_MERCHANT` | `DEFAULT` | Merchant store code |
| `APP_PAYMENT_TYPE` | `STRIPE` | Payment provider |
| `APP_STRIPE_KEY` | _(empty)_ | Stripe publishable key |
| `APP_MAP_API_KEY` | _(empty)_ | Google Maps API key |
| `APP_THEME_COLOR` | `#D1D1D1` | Primary theme colour |

→ See [DOCKER_BUILD_GUIDE.md](docs/DOCKER_BUILD_GUIDE.md) for advanced usage and full env var list.
