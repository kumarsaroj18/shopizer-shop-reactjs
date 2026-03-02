# Quick Start - CI/CD Pipeline

## Setup (One-time)

1. **Install GitHub CLI**:
   ```bash
   # macOS
   brew install gh
   
   # Windows
   winget install GitHub.cli
   ```

2. **Authenticate**:
   ```bash
   gh auth login
   ```

3. **Update Repository Name**:
   Edit `scripts/download-and-deploy.sh` (or `.bat` for Windows):
   ```bash
   GITHUB_REPO="YOUR_USERNAME/shopizer-shop-reactjs"
   ```

## Download & Run

### Quick Commands

```bash
# Download and run latest build
./scripts/download-and-deploy.sh
cd deployed/shopizer-react-build-*
npx serve -s . -p 3000

# Download specific build
./scripts/download-and-deploy.sh 42 build

# Download Docker image
./scripts/download-and-deploy.sh latest docker
docker run -p 80:80 shopizer-shop-reactjs:latest
```

### Windows

```cmd
scripts\download-and-deploy.bat
cd deployed\shopizer-react-build-*
npx serve -s . -p 3000
```

## Artifact Types

- `build` - Build directory (default)
- `release` - Compressed package
- `docker` - Docker image
- `coverage` - Test coverage reports

## Access Application

- **Build/Release**: http://localhost:3000
- **Docker**: http://localhost

## Configuration

Before running, update backend URL in `deployed/env-config.js`:
```javascript
window._env_ = {
  APP_BASE_URL: "http://localhost:8080",
  APP_MERCHANT: "DEFAULT"
};
```

## Troubleshooting

```bash
# Check authentication
gh auth status

# List available builds
gh run list --repo YOUR_USERNAME/shopizer-shop-reactjs --workflow=ci-cd.yml

# Make script executable (Linux/macOS)
chmod +x scripts/download-and-deploy.sh
```

## Full Documentation

See `CI_CD_DOCUMENTATION.md` for complete details.
