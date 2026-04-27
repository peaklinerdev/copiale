#!/usr/bin/env bash
# CI guard: regenerate types from the API and fail if they differ from
# what's checked in. Run after gen-api-types.sh.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

bash "$REPO_ROOT/scripts/gen-api-types.sh"

if ! git -C "$REPO_ROOT" diff --exit-code openapi.snapshot.json src/types/api.generated.ts; then
  echo
  echo "API types drifted. Run 'npm run gen:api-types' and commit." >&2
  exit 1
fi
