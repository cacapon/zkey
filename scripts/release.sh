#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: npm run release <version>"
  echo "Example: npm run release 0.4.0"
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: uncommitted changes exist. Please commit or stash them before releasing."
  git status --short
  exit 1
fi

jq --arg v "$VERSION" '.version = $v' manifest.json > tmp.json && mv tmp.json manifest.json
git add manifest.json
git commit -m "chore: bump version to $VERSION"
git push
git tag "$VERSION"
git push origin "$VERSION"
