# CI/CD Scripts

This directory contains scripts for downloading and deploying artifacts from GitHub Actions.

## Scripts

### download-and-deploy.sh (Linux/macOS)
Bash script to download artifacts from GitHub Actions and prepare them for local deployment.

**Usage**:
```bash
./download-and-deploy.sh [BUILD_NUMBER] [ARTIFACT_TYPE]
```

**Examples**:
```bash
# Download latest build
./download-and-deploy.sh

# Download specific build
./download-and-deploy.sh 42

# Download release package
./download-and-deploy.sh latest release

# Download Docker image
./download-and-deploy.sh 42 docker

# Download test coverage
./download-and-deploy.sh latest coverage
```

### download-and-deploy.bat (Windows)
Windows batch script with same functionality as the bash version.

**Usage**:
```cmd
download-and-deploy.bat [BUILD_NUMBER] [ARTIFACT_TYPE]
```

## Prerequisites

1. GitHub CLI installed (`gh`)
2. Authenticated with GitHub (`gh auth login`)
3. Update `GITHUB_REPO` variable in scripts with your repository name

## Artifact Types

- **build** - Complete build directory (default)
- **release** - Compressed tar.gz package
- **docker** - Docker image (compressed)
- **coverage** - Test coverage reports

## Configuration

Before first use, edit the script and update:
```bash
GITHUB_REPO="YOUR_GITHUB_USERNAME/shopizer-shop-reactjs"
```

## Output

All artifacts are downloaded to the `deployed/` directory in the project root.

## Troubleshooting

### Script not executable (Linux/macOS)
```bash
chmod +x download-and-deploy.sh
```

### Authentication error
```bash
gh auth login
```

### Artifact not found
- Check if the build number exists
- Verify the workflow run was successful
- Check if artifact has expired (retention period)

## See Also

- `../CI_CD_DOCUMENTATION.md` - Complete CI/CD documentation
- `../QUICK_START_CI_CD.md` - Quick start guide
- `../.github/workflows/ci-cd.yml` - GitHub Actions workflow
