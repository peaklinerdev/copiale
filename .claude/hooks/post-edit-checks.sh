#!/usr/bin/env bash
# PostToolUse hook for Edit|Write on TS/TSX files:
#   1. eslint --fix on the touched file
#   2. tsc -b --noEmit project-wide typecheck
# Always exits 0 so Claude sees the diagnostics as feedback, not a block.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // ""')

case "$file" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

echo "--- eslint --fix $file ---"
npx --no-install eslint --fix "$file" 2>&1 | tail -20 || true

echo "--- tsc -b --noEmit ---"
npx --no-install tsc -b --noEmit 2>&1 | tail -20 || true

exit 0
