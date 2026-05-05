#!/usr/bin/env bash
# Generate copiale-p2p frontend API types from copiale-p2p-api's OpenAPI spec.
#
# Strategy: invoke copiale-p2p-api's pure dump-openapi.ts (no DB/server required)
# to produce the spec, snapshot it for drift detection, then run
# openapi-typescript via npx (run from /tmp because the project's package.json
# has an `npm:`-aliased override that older npms fail to parse).
#
# Requires: copiale-p2p-api checked out at ../copiale-p2p-api with deps installed.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_REPO="${COPIALE_API_REPO:-$REPO_ROOT/../copiale-p2p-api}"

if [ ! -d "$API_REPO" ]; then
  echo "copiale-p2p-api not found at $API_REPO. Set COPIALE_API_REPO env var." >&2
  exit 1
fi

SPEC="$REPO_ROOT/openapi.snapshot.json"
OUT="$REPO_ROOT/src/types/api.generated.ts"

echo "Dumping OpenAPI spec from $API_REPO..."
(cd "$API_REPO" && pnpm exec ts-node scripts/dump-openapi.ts) > "$SPEC"

echo "Generating types -> $OUT..."
(cd /tmp && npx --yes openapi-typescript@latest "$SPEC" -o "$OUT")

echo "Done."
