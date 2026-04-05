#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

fail() {
  echo "Error: $*" >&2
  exit 1
}

log() {
  echo "[build-backend] $*"
}

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    fail "Missing required command: ${command_name}"
  fi
}

check_node_version() {
  require_command node

  local node_version
  local node_major
  local node_minor

  node_version="$(node -p 'process.versions.node')"
  node_major="${node_version%%.*}"
  local _rest="${node_version#*.}"
  node_minor="${_rest%%.*}"

  if (( node_major < 18 || (node_major == 18 && node_minor < 12) )); then
    fail "Node.js >= 18.12 is required, current version is ${node_version}"
  fi

  log "Using Node.js ${node_version}"
}

setup_pnpm() {
  if command -v corepack >/dev/null 2>&1; then
    PNPM_CMD=(corepack pnpm)
    log "Using pnpm via corepack"
    return
  fi

  if command -v pnpm >/dev/null 2>&1; then
    PNPM_CMD=(pnpm)
    log "Using global pnpm"
    return
  fi

  fail "pnpm is not available. Install pnpm or use a Node.js distribution with corepack."
}

ensure_backend_env() {
  if [[ -f "apps/backend/.env" ]]; then
    return
  fi

  if [[ -f "apps/backend/.env.example" ]]; then
    cp "apps/backend/.env.example" "apps/backend/.env"
    log "Created apps/backend/.env from apps/backend/.env.example"
    log "Review apps/backend/.env before starting the production server"
    return
  fi

  log "apps/backend/.env.example not found, skipping .env bootstrap"
}

ensure_production_env() {
  local env_file="apps/backend/.env"

  if [[ ! -f "${env_file}" ]]; then
    log "apps/backend/.env not found, skipping NODE_ENV update"
    return
  fi

  if grep -q '^NODE_ENV=' "${env_file}"; then
    sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=production/' "${env_file}"
  else
    printf '\nNODE_ENV=production\n' >>"${env_file}"
  fi

  rm -f "${env_file}.bak"
  log "Set NODE_ENV=production in apps/backend/.env"
}

prepare_runtime_dirs() {
  mkdir -p data/db data/uploads data/cache data/logs
  log "Ensured runtime directories under data/"
}

install_dependencies() {
  if [[ "${SKIP_PNPM_INSTALL:-0}" == "1" ]]; then
    log "Skipping dependency installation because SKIP_PNPM_INSTALL=1"
    return
  fi

  log "Installing workspace dependencies"
  "${PNPM_CMD[@]}" install \
    --frozen-lockfile \
    --child-concurrency="${PNPM_CHILD_CONCURRENCY:-1}" \
    --network-concurrency="${PNPM_NETWORK_CONCURRENCY:-1}"
}

build_backend() {
  log "Building backend with low-memory profile"
  "${PNPM_CMD[@]}" --filter backend build:pi
}

deploy_backend() {
  local deploy_dir="release/.backend-deploy"

  log "Deploying production dependencies via pnpm deploy"
  rm -rf "${deploy_dir}"
  NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=192" \
    "${PNPM_CMD[@]}" deploy --legacy --filter backend --prod "${deploy_dir}"

  rm -rf "release/backend/node_modules"
  mv "${deploy_dir}/node_modules" "release/backend/node_modules"
  rm -rf "${deploy_dir}"
}

install_driver_deps() {
  if ! command -v pip3 >/dev/null 2>&1; then
    log "pip3 not found, skipping driver dependency installation"
    return
  fi

  log "Installing Python driver dependencies"

  local waveshare_driver_dir="release/backend/driver/waveshare"
  if [[ ! -d "${waveshare_driver_dir}" ]]; then
    log "Driver directory not found at ${waveshare_driver_dir}, skipping pip install"
    return
  fi

  pip3 install -e "${waveshare_driver_dir}" \
    --quiet \
    --disable-pip-version-check \
    --break-system-packages

  local ups_driver_dir="release/backend/driver/ups"
  if [[ ! -d "${ups_driver_dir}" ]]; then
    log "Driver directory not found at ${ups_driver_dir}, skipping pip install"
    return
  fi

  pip3 install -e "${ups_driver_dir}" \
    --quiet \
    --disable-pip-version-check \
    --break-system-packages
}

promote_backend() {
  log "Promoting backend build output to release/backend"
  rm -rf "release/backend"
  mv "apps/backend/dist" "release/backend"

  if [[ -f "apps/backend/.env" ]]; then
    log "Copying apps/backend/.env to release/.env"
    cp "apps/backend/.env" "release/.env"
  fi
}

print_next_steps() {
  local node_env_value="missing"

  if [[ -f "apps/backend/.env" ]]; then
    node_env_value="$(
      awk -F= '
        $1 == "NODE_ENV" {
          gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2);
          gsub(/^"/, "", $2);
          gsub(/"$/, "", $2);
          print $2;
          found = 1;
        }
        END {
          if (!found) {
            print "unset";
          }
        }
      ' apps/backend/.env
    )"
  fi

  log "Build completed"
  echo
  echo "Next steps:"
  echo "  1. Review apps/backend/.env and set OSS credentials."
  echo "  2. Frontend artifacts are served from release/frontend/ and should arrive via git pull."
  echo "  3. Backend artifacts have been promoted to release/backend/."
  echo "  4. Start or restart the service with: bash ./scripts/run-on-pi.sh"
  echo

  if [[ "${node_env_value}" != "production" ]]; then
    echo "Warning: apps/backend/.env currently has NODE_ENV=${node_env_value}"
  else
    echo "Confirmed: apps/backend/.env has NODE_ENV=production"
  fi
}

main() {
  check_node_version
  setup_pnpm
  ensure_backend_env
  ensure_production_env
  prepare_runtime_dirs
  install_dependencies
  build_backend
  promote_backend
  deploy_backend
  install_driver_deps
  print_next_steps
}

main "$@"
