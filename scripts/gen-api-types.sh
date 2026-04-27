#!/usr/bin/env bash
# Generate yapbay frontend API types from yapbay-api's OpenAPI spec.
#
# Strategy: invoke yapbay-api's pure dump-openapi.ts (no DB/server required)
# to produce the spec, snapshot it for drift detection, then run
# openapi-typescript via npx (run from /tmp because the project's package.json
# has an `npm:`-aliased override that older npms fail to parse).
#
# Requires: yapbay-api checked out at ../yapbay-api with deps installed.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_REPO="${YAPBAY_API_REPO:-$REPO_ROOT/../yapbay-api}"

if [ ! -d "$API_REPO" ]; then
  echo "yapbay-api not found at $API_REPO. Set YAPBAY_API_REPO env var." >&2
  exit 1
fi

SPEC="$REPO_ROOT/openapi.snapshot.json"
OUT="$REPO_ROOT/src/types/api.generated.ts"

echo "Dumping OpenAPI spec from $API_REPO..."
(cd "$API_REPO" && pnpm exec ts-node scripts/dump-openapi.ts) > "$SPEC"

echo "Generating types -> $OUT..."
(cd /tmp && npx --yes openapi-typescript@latest "$SPEC" -o "$OUT")

echo "Done."
