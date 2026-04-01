#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

log() {
  echo "[build-frontend] $*"
}

frontend_dist_dir="apps/frontend/dist"
release_frontend_dir="release/frontend"
version_file="release/VERSION"

log "Building frontend"
pnpm --filter frontend build

log "Refreshing ${release_frontend_dir}"
mkdir -p "${release_frontend_dir}"
find "${release_frontend_dir}" -mindepth 1 ! -name ".gitkeep" -exec rm -rf {} +
cp -R "${frontend_dist_dir}/." "${release_frontend_dir}/"

version="$(
  node -p "JSON.parse(require('node:fs').readFileSync('package.json', 'utf8')).version"
)"

printf '%s\n' "${version}" >"${version_file}"
log "Wrote ${version} to ${version_file}"

echo
echo "Frontend release artifacts are ready."
echo "Next: git add release/frontend release/VERSION"
echo "Then: git commit -m \"chore: release frontend artifacts\" && git push"
