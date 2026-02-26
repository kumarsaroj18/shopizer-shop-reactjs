# GitHub Actions CI/CD Pipeline - Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline automatically runs tests, builds artifacts, and creates Docker images on every push and pull request.

## Pipeline Stages

### 1. Test Stage
- Runs on: `ubuntu-latest`
- Node version: `16.x`
- Actions:
  - Install dependencies with `npm ci --legacy-peer-deps`
  - Run tests with coverage: `npm test -- --watchAll=false --passWithNoTests --coverage`
  - Upload test coverage reports as artifacts

### 2. Build Stage
- Runs on: `ubuntu-latest`
- Node version: `16.x`
- Depends on: Test stage success
- Actions:
  - Install dependencies
  - Build production bundle: `npm run build`
  - Create build metadata (build number, commit SHA, branch, date)
  - Upload build artifacts
  - Create compressed release package (.tar.gz)

### 3. Docker Stage
- Runs on: `ubuntu-latest`
- Depends on: Build stage success
- Only runs on: Push to main/master branch
- Actions:
  - Build Docker image
  - Tag with build number and 'latest'
  - Save Docker image as compressed artifact

## Artifacts Generated

### 1. Build Artifacts
- **Name**: `shopizer-react-build-{BUILD_NUMBER}`
- **Contents**: Complete build directory with static files
- **Retention**: 90 days
- **Size**: ~5-10 MB

### 2. Release Package
- **Name**: `shopizer-react-release-{BUILD_NUMBER}`
- **Contents**: Compressed tar.gz of build directory
- **Retention**: 90 days
- **Size**: ~2-5 MB (compressed)

### 3. Docker Image
- **Name**: `shopizer-react-docker-{BUILD_NUMBER}`
- **Contents**: Complete Docker image (compressed)
- **Retention**: 30 days
- **Size**: ~100-200 MB (compressed)

### 4. Test Coverage
- **Name**: `test-coverage-{BUILD_NUMBER}`
- **Contents**: Jest coverage reports (HTML, JSON, LCOV)
- **Retention**: 30 days
- **Size**: ~1-2 MB

## Downloading and Running Artifacts

### Prerequisites

1. **Install GitHub CLI**:
   ```bash
   # macOS
   brew install gh
   
   # Windows
   winget install GitHub.cli
   
   # Linux
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh
   ```

2. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

3. **Update Repository Name**:
   Edit the script and replace `YOUR_GITHUB_USERNAME/shopizer-shop-reactjs` with your actual repository.

### Using the Download Script

#### Linux/macOS

```bash
# Download latest build artifacts
./scripts/download-and-deploy.sh

# Download specific build number
./scripts/download-and-deploy.sh 42

# Download release package
./scripts/download-and-deploy.sh latest release

# Download Docker image
./scripts/download-and-deploy.sh 42 docker

# Download test coverage
./scripts/download-and-deploy.sh latest coverage
```

#### Windows

```cmd
REM Download latest build artifacts
scripts\download-and-deploy.bat

REM Download specific build number
scripts\download-and-deploy.bat 42

REM Download release package
scripts\download-and-deploy.bat latest release

REM Download Docker image
scripts\download-and-deploy.bat 42 docker

REM Download test coverage
scripts\download-and-deploy.bat latest coverage
```

### Manual Download via GitHub CLI

```bash
# List recent workflow runs
gh run list --repo YOUR_USERNAME/shopizer-shop-reactjs --workflow=ci-cd.yml --limit=10

# Download specific artifact
gh run download RUN_ID --repo YOUR_USERNAME/shopizer-shop-reactjs --name ARTIFACT_NAME
```

### Manual Download via GitHub Web UI

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Click on a workflow run
4. Scroll down to "Artifacts" section
5. Click on artifact name to download

## Running Downloaded Artifacts

### 1. Build Artifacts

```bash
cd deployed/shopizer-react-build-{BUILD_NUMBER}

# Option 1: Using serve (recommended)
npx serve -s . -p 3000

# Option 2: Using Python
python3 -m http.server 3000

# Option 3: Using Node.js http-server
npx http-server -p 3000
```

Access at: http://localhost:3000

### 2. Release Package

```bash
cd deployed

# Extract (if not auto-extracted)
tar -xzf shopizer-react-{BUILD_NUMBER}.tar.gz

# Serve
npx serve -s . -p 3000
```

### 3. Docker Image

```bash
# Load image (if not auto-loaded)
docker load < shopizer-react-docker-{BUILD_NUMBER}.tar.gz

# Run container
docker run -d -p 80:80 --name shopizer-react shopizer-shop-reactjs:{BUILD_NUMBER}

# Or run latest
docker run -d -p 80:80 --name shopizer-react shopizer-shop-reactjs:latest
```

Access at: http://localhost

### 4. Test Coverage

```bash
# Open coverage report
open deployed/test-coverage-{BUILD_NUMBER}/lcov-report/index.html

# Or on Linux
xdg-open deployed/test-coverage-{BUILD_NUMBER}/lcov-report/index.html

# Or on Windows
start deployed\test-coverage-{BUILD_NUMBER}\lcov-report\index.html
```

## Environment Configuration

Before running the application, configure the backend URL:

```bash
# Edit public/env-config.js or deployed build
vim deployed/env-config.js
```

Update:
```javascript
window._env_ = {
  APP_BASE_URL: "http://your-backend-url:8080",
  APP_MERCHANT: "DEFAULT",
  // ... other settings
};
```

## Troubleshooting

### Authentication Issues

```bash
# Check authentication status
gh auth status

# Re-authenticate
gh auth login

# Use token authentication
export GITHUB_TOKEN=your_personal_access_token
```

### Artifact Not Found

- Check if the workflow run was successful
- Verify the build number exists
- Check artifact retention period (may have expired)

### Permission Denied

```bash
# Make script executable
chmod +x scripts/download-and-deploy.sh
```

### Docker Issues

```bash
# Check Docker is running
docker ps

# Check loaded images
docker images | grep shopizer

# Remove old containers
docker rm -f shopizer-react
```

## CI/CD Configuration

### Trigger Events

- **Push**: Runs on push to main, master, or develop branches
- **Pull Request**: Runs on PR to main, master, or develop branches

### Customization

Edit `.github/workflows/ci-cd.yml` to:
- Change Node.js version
- Modify test commands
- Add deployment steps
- Configure notifications
- Add security scanning

### Secrets Configuration

Add these secrets in GitHub repository settings (if needed):
- `DOCKERHUB_USERNAME` - Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token
- `SLACK_WEBHOOK` - Slack notification webhook

## Best Practices

1. **Always test locally before pushing**
2. **Use semantic versioning for releases**
3. **Keep artifacts for important builds**
4. **Monitor workflow execution times**
5. **Review test coverage reports**
6. **Clean up old Docker images**

## Monitoring

### View Workflow Status

```bash
# List recent runs
gh run list --repo YOUR_USERNAME/shopizer-shop-reactjs

# View specific run
gh run view RUN_ID

# Watch run in real-time
gh run watch RUN_ID
```

### Check Build Status Badge

Add to README.md:
```markdown
![CI/CD](https://github.com/YOUR_USERNAME/shopizer-shop-reactjs/workflows/CI/CD%20Pipeline/badge.svg)
```

## Support

For issues with:
- **GitHub Actions**: Check workflow logs in Actions tab
- **Download Script**: Run with `bash -x` for debug output
- **Artifacts**: Verify retention period hasn't expired
- **Docker**: Check Docker daemon is running

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Docker Documentation](https://docs.docker.com/)
