#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}"
SERVICE_NAME="tuanzi-photo.service"
SERVICE_SRC="${REPO_ROOT}/${SERVICE_NAME}"
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

run_build() {
  log "Running build-on-pi.sh"
  bash "${REPO_ROOT}/build-on-pi.sh"
}

install_service() {
  log "Installing ${SERVICE_NAME} to ${SERVICE_DST}"
  sudo install -m 644 "${SERVICE_SRC}" "${SERVICE_DST}"
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
  run_build
  install_service
  reload_and_restart_service
  show_status
}

main "$@"
