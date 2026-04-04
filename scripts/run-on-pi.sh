#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVICE_NAME="tuanzi-photo.service"
SERVICE_SRC="${REPO_ROOT}/scripts/${SERVICE_NAME}"
SERVICE_DST="/etc/systemd/system/${SERVICE_NAME}"

cd "${REPO_ROOT}"

fail() {
  echo "Error: $*" >&2
  exit 1
}

log() {
  echo "[run-on-pi] $*"
}

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    fail "Missing required command: ${command_name}"
  fi
}

check_service_template() {
  [[ -f "${SERVICE_SRC}" ]] || fail "Missing service file: ${SERVICE_SRC}"
  grep -q '^ExecStart=' "${SERVICE_SRC}" || fail "Service file is missing ExecStart"
  grep -q '^WorkingDirectory=' "${SERVICE_SRC}" || fail "Service file is missing WorkingDirectory"
}

stop_service_if_running() {
  if sudo systemctl is-active --quiet "${SERVICE_NAME}"; then
    log "Stopping ${SERVICE_NAME} before build to free memory"
    sudo systemctl stop "${SERVICE_NAME}"
  fi
}

run_build() {
  log "Running build-backend.sh"
  bash "${REPO_ROOT}/scripts/build-backend.sh"
}

install_service() {
  local node_bin
  node_bin="$(command -v node 2>/dev/null || true)"
  [[ -n "${node_bin}" ]] || fail "Cannot find node binary; ensure Node.js is on PATH"

  log "Using node at ${node_bin}"

  local tmp_service
  tmp_service="$(mktemp)"
  sed \
    -e "s|__NODE_BIN__|${node_bin}|g" \
    -e "s|__WORKING_DIR__|${REPO_ROOT}/release|g" \
    "${SERVICE_SRC}" > "${tmp_service}"
  sudo install -m 644 "${tmp_service}" "${SERVICE_DST}"
  rm -f "${tmp_service}"

  log "Installed ${SERVICE_NAME} to ${SERVICE_DST}"
}

reload_and_restart_service() {
  log "Reloading systemd daemon"
  sudo systemctl daemon-reload

  log "Enabling ${SERVICE_NAME}"
  sudo systemctl enable "${SERVICE_NAME}"

  log "Restarting ${SERVICE_NAME}"
  sudo systemctl restart "${SERVICE_NAME}"
}

show_status() {
  log "Service status"
  sudo systemctl --no-pager --full status "${SERVICE_NAME}"
}

main() {
  require_command bash
  require_command sudo
  require_command systemctl
  check_service_template
  stop_service_if_running
  run_build
  install_service
  reload_and_restart_service
  show_status
}

main "$@"
