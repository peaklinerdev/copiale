#!/usr/bin/env bash
set -euo pipefail

file=$(jq -r '.tool_input.file_path // .tool_input.path // ""')
[ -z "$file" ] && exit 0

rel="${file#"$PWD/"}"

protected_patterns=(
  '(^|/)\.env($|\.)'
  '(^|/)jwt2?\.txt$'
  '.*\.pem$'
  '.*\.key$'
  '(^|/)package-lock\.json$'
  '(^|/)yarn\.lock$'
  '(^|/)\.npmrc$'
  '(^|/)commit\.txt$'
  '(^|/)stats\.html$'
  '(^|/)Containerfile$'
  '(^|/)\.git/'
  '(^|/)secrets/'
)

for pattern in "${protected_patterns[@]}"; do
  if echo "$rel" | grep -qE "$pattern"; then
    echo "Blocked: '$rel' is a protected file." >&2
    echo "If editing this is intentional, ask the user to make the change." >&2
    exit 2
  fi
done

exit 0
