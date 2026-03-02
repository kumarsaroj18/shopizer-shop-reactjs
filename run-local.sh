#!/usr/bin/env bash
# =============================================================================
# run-local.sh — Run Shopizer React Shop locally
# =============================================================================
# Usage:
#   ./run-local.sh [OPTIONS]
#
# Options:
#   --mode docker   (default) Pull latest Docker image from ghcr.io and run
#   --mode build    Download latest React build from GitHub Actions CI and serve
#   --mode local    Build from source locally with npm and run (no CI artifacts needed)
#   --owner <name>  GitHub owner/org name (defaults to git remote origin owner)
#   --tag <tag>     Docker image tag to pull (default: latest)
#   --backend <url> Shopizer backend base URL (default: http://localhost:8080)
#   --merchant <id> Merchant store code (default: DEFAULT)
#   --help          Show this help message
#
# Prerequisites:
#   docker         Required for all modes
#   node / npm     Required only for --mode local
#   gh             Required only for --mode build (GitHub CLI: https://cli.github.com)
# =============================================================================

set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m';  GREEN='\033[0;32m'
YELLOW='\033[1;33m'; BLUE='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ─── Defaults ─────────────────────────────────────────────────────────────────
MODE="docker"
TAG="latest"
APP_PORT=3000
APP_CONTAINER=shopizer-react-app
BACKEND_URL="http://localhost:8080"
MERCHANT="DEFAULT"
OWNER=""

usage() {
  sed -n '/^# Usage/,/^# ====/p' "$0" | grep -v '^# ====' | sed 's/^# //'
  exit 0
}

# ─── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)     MODE="$2";        shift 2 ;;
    --owner)    OWNER="$2";       shift 2 ;;
    --tag)      TAG="$2";         shift 2 ;;
    --backend)  BACKEND_URL="$2"; shift 2 ;;
    --merchant) MERCHANT="$2";    shift 2 ;;
    --help|-h)  usage ;;
    *) error "Unknown option: $1"; usage ;;
  esac
done

if [[ "$MODE" != "docker" && "$MODE" != "build" && "$MODE" != "local" ]]; then
  error "--mode must be 'docker', 'build', or 'local'"; exit 1
fi

# ─── Detect GitHub owner/repo from git remote ─────────────────────────────────
detect_owner_repo() {
  local remote_url
  remote_url=$(git remote get-url origin 2>/dev/null || true)

  if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
  else
    OWNER=""
    REPO="shopizer-shop-reactjs"
  fi
}

if [[ -z "$OWNER" ]]; then
  detect_owner_repo
  if [[ -z "$OWNER" ]]; then
    error "Could not detect GitHub owner from git remote. Pass --owner <name>."
    exit 1
  fi
else
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  REPO=$(echo "$REMOTE_URL" | sed 's|.*github\.com[:/][^/]*/||;s|\.git$||')
  REPO="${REPO:-shopizer-shop-reactjs}"
fi

IMAGE="ghcr.io/${OWNER}/shopizer-shop-reactjs:${TAG}"

# ─── Check prerequisites ──────────────────────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    error "Required tool not found: $1. $2"
    exit 1
  fi
}

info "Checking prerequisites..."
check_cmd docker "Install Docker: https://docs.docker.com/get-docker/"
if [[ "$MODE" == "build" ]]; then
  check_cmd gh "Install GitHub CLI: https://cli.github.com/"
fi
if [[ "$MODE" == "local" ]]; then
  check_cmd node "Install Node.js 16+: https://nodejs.org/"
  check_cmd npm  "npm comes with Node.js"
fi
success "All prerequisites satisfied"

# ─── Cleanup helper ───────────────────────────────────────────────────────────
cleanup_containers() {
  info "Stopping and removing containers..."
  docker rm -f "$APP_CONTAINER" 2>/dev/null || true
  success "Cleanup done."
}

trap '
  echo ""
  warn "Interrupt received — cleaning up..."
  cleanup_containers
' INT TERM

# ─── GHCR Authentication ──────────────────────────────────────────────────────
ghcr_login() {
  info "Authenticating with GitHub Container Registry (ghcr.io)..."

  if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
    gh auth token | docker login ghcr.io -u "$OWNER" --password-stdin 2>/dev/null \
      && { success "Logged in to ghcr.io via GitHub CLI token"; return; }
  fi

  warn "Could not authenticate automatically. Please enter your GitHub credentials."
  warn "Use a Personal Access Token (PAT) with 'read:packages' scope as the password."
  warn "Create one at: https://github.com/settings/tokens/new?scopes=read:packages"
  docker login ghcr.io -u "$OWNER"
}

# ─── Run container helper ─────────────────────────────────────────────────────
# Passes all supported env vars; env.sh inside the container regenerates env-config.js
start_container() {
  local img="$1"
  info "Starting Shopizer React Shop container from image: $img"
  docker rm -f "$APP_CONTAINER" 2>/dev/null || true

  docker run -d \
    --name "$APP_CONTAINER" \
    -e APP_BASE_URL="${BACKEND_URL}" \
    -e APP_API_VERSION="/api/v1/" \
    -e APP_MERCHANT="${MERCHANT}" \
    -e APP_PRODUCTION="false" \
    -e APP_PRODUCT_GRID_LIMIT="15" \
    -e APP_MAP_API_KEY="" \
    -e APP_PAYMENT_TYPE="STRIPE" \
    -e APP_STRIPE_KEY="" \
    -e APP_THEME_COLOR="#D1D1D1" \
    -p "${APP_PORT}:80" \
    "$img"
}

# ─── MODE: docker ─────────────────────────────────────────────────────────────
run_docker_mode() {
  info "Mode: docker — pulling $IMAGE"

  if ! docker pull "$IMAGE" --quiet 2>/dev/null; then
    ghcr_login
    if ! docker pull "$IMAGE"; then
      echo ""
      error "Could not pull $IMAGE"
      error "This usually means either:"
      error "  1. The GitHub Actions CI pipeline hasn't run yet on main/master."
      error "     → Push the .github/workflows/ci-cd.yml to your repo and let it complete."
      error "  2. The package is private and auth failed."
      error "     → Make it public: https://github.com/users/${OWNER}/packages"
      error "  3. Or use --mode local to build and run from source instead:"
      error "     → ./run-local.sh --mode local"
      exit 1
    fi
  fi
  success "Image ready: $IMAGE"

  start_container "$IMAGE"
  print_startup_info "docker rm -f ${APP_CONTAINER}"
}

# ─── MODE: build ──────────────────────────────────────────────────────────────
run_build_mode() {
  info "Mode: build — downloading latest React build from GitHub Actions CI"

  if ! gh auth status &>/dev/null; then
    error "Not logged in to GitHub CLI. Run: gh auth login"
    exit 1
  fi

  BUILD_DIR="/tmp/shopizer-react-build-run"
  mkdir -p "$BUILD_DIR"

  info "Fetching latest successful workflow run from ${OWNER}/${REPO}..."

  RUN_ID=$(gh run list \
    --repo "${OWNER}/${REPO}" \
    --workflow ci-cd.yml \
    --status success \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId')

  if [[ -z "$RUN_ID" || "$RUN_ID" == "null" ]]; then
    error "No successful CI workflow runs found for ${OWNER}/${REPO}."
    error "Make sure the CI pipeline has run at least once successfully on main/master."
    error "Or use --mode local to build from source: ./run-local.sh --mode local"
    exit 1
  fi

  info "Found successful run ID: $RUN_ID. Downloading artifact..."

  ARTIFACT_DOWNLOAD_DIR="${BUILD_DIR}/artifact"
  mkdir -p "$ARTIFACT_DOWNLOAD_DIR"

  gh run download "$RUN_ID" \
    --repo "${OWNER}/${REPO}" \
    --pattern "shopizer-react-release-*" \
    --dir "$ARTIFACT_DOWNLOAD_DIR"

  TARBALL=$(find "$ARTIFACT_DOWNLOAD_DIR" -name "shopizer-react-*.tar.gz" | head -1)
  if [[ -z "$TARBALL" ]]; then
    error "Could not find shopizer-react-*.tar.gz in downloaded artifacts."
    ls -la "$ARTIFACT_DOWNLOAD_DIR" || true
    exit 1
  fi

  success "Downloaded: $(basename "$TARBALL")"

  SERVE_DIR="${BUILD_DIR}/build"
  mkdir -p "$SERVE_DIR"
  tar -xzf "$TARBALL" -C "$SERVE_DIR"
  success "React build extracted to: $SERVE_DIR"

  info "Starting Shopizer React Shop container (nginx + volume mount)..."
  docker rm -f "$APP_CONTAINER" 2>/dev/null || true

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  docker run -d \
    --name "$APP_CONTAINER" \
    -v "${SERVE_DIR}:/usr/share/nginx/html:ro" \
    -v "${SCRIPT_DIR}/conf:/etc/nginx:ro" \
    -e APP_BASE_URL="${BACKEND_URL}" \
    -e APP_API_VERSION="/api/v1/" \
    -e APP_MERCHANT="${MERCHANT}" \
    -e APP_PRODUCTION="false" \
    -e APP_PRODUCT_GRID_LIMIT="15" \
    -e APP_MAP_API_KEY="" \
    -e APP_PAYMENT_TYPE="STRIPE" \
    -e APP_STRIPE_KEY="" \
    -e APP_THEME_COLOR="#D1D1D1" \
    -p "${APP_PORT}:80" \
    nginx:stable-alpine

  print_startup_info "docker rm -f ${APP_CONTAINER}"
}

# ─── MODE: local ──────────────────────────────────────────────────────────────
run_local_mode() {
  info "Mode: local — building from source and running"
  warn "This will run a full npm build. It may take a few minutes on first run."

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  if [[ ! -d "${SCRIPT_DIR}/node_modules" ]]; then
    info "Installing npm dependencies (--legacy-peer-deps)..."
    (cd "$SCRIPT_DIR" && npm ci --legacy-peer-deps)
  else
    info "node_modules already present — skipping npm install."
    info "Run 'npm ci --legacy-peer-deps' manually if dependencies have changed."
  fi

  info "Building React production bundle..."
  (cd "$SCRIPT_DIR" && CI=false npm run build)

  if [[ ! -d "${SCRIPT_DIR}/build" ]]; then
    error "Build failed — ${SCRIPT_DIR}/build not found."
    exit 1
  fi
  success "Build complete: ${SCRIPT_DIR}/build"

  info "Building Docker image shopizer-shop-reactjs:local-latest..."
  (cd "$SCRIPT_DIR" && docker build -f Dockerfile.local -t shopizer-shop-reactjs:local-latest .)
  success "Image built: shopizer-shop-reactjs:local-latest"

  start_container "shopizer-shop-reactjs:local-latest"
  print_startup_info "docker rm -f ${APP_CONTAINER}"
}

# ─── Print startup banner ─────────────────────────────────────────────────────
print_startup_info() {
  local stop_cmd="$1"
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Shopizer React Shop is starting up!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  🛍️   Shop URL         : ${BLUE}http://localhost:${APP_PORT}${NC}"
  echo -e "  🔌  Backend URL      : ${BLUE}${BACKEND_URL}${NC}"
  echo -e "  🏪  Merchant         : ${BLUE}${MERCHANT}${NC}"
  echo ""
  echo -e "  🔑  Customer Login (created by populate-db.sh):"
  echo -e "      Username: ${YELLOW}john.doe2@example.com${NC}"
  echo -e "      Password: ${YELLOW}password123${NC}"
  echo ""
  echo -e "${YELLOW}┌────────────────────────────────────────────────────────────┐${NC}"
  echo -e "${YELLOW}│  ⚠️  IMPORTANT: Database is NOT persisted                  │${NC}"
  echo -e "${YELLOW}│                                                            │${NC}"
  echo -e "${YELLOW}│  All data is lost when you stop the backend.              │${NC}"
  echo -e "${YELLOW}│  Run ONCE after EVERY backend start from shopizer/:       │${NC}"
  echo -e "${YELLOW}│                                                            │${NC}"
  echo -e "${YELLOW}│      ${NC}cd ../shopizer && ./populate-db.sh${YELLOW}                 │${NC}"
  echo -e "${YELLOW}│                                                            │${NC}"
  echo -e "${YELLOW}│  This creates stores, products, and customer accounts.    │${NC}"
  echo -e "${YELLOW}└────────────────────────────────────────────────────────────┘${NC}"
  echo ""
  echo -e "  ℹ️   The app may take a few seconds for nginx to become ready."
  echo ""
  echo -e "  To view logs : ${YELLOW}docker logs -f ${APP_CONTAINER}${NC}"
  echo -e "  To stop      : ${YELLOW}${stop_cmd}${NC}"
  echo -e "  Or press     : ${YELLOW}Ctrl+C${NC} (cleans up automatically)"
  echo ""
  echo -e "  ⚠️  Make sure Shopizer backend is running at ${BACKEND_URL}"
  echo -e "     Run the backend: cd ../shopizer && ./run-local.sh"
  echo ""
}

# ─── Main ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Shopizer React Shop — Local Runner     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
info "Repository : ${OWNER}/${REPO}"
info "Mode       : ${MODE}"
info "Backend    : ${BACKEND_URL}"
info "Merchant   : ${MERCHANT}"
[[ "$MODE" == "docker" ]] && info "Image      : ${IMAGE}"
echo ""

case "$MODE" in
  docker) run_docker_mode ;;
  build)  run_build_mode ;;
  local)  run_local_mode ;;
esac
