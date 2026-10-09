#!/bin/sh
set -e
cd "$(dirname "$0")/.."
npm run build > /dev/null 2>&1
for f in dist/*.js; do
  hash=$(shasum -a 256 "$f" | cut -d' ' -f1)
  printf '%s  %s\n' "$hash" "$f"
done
