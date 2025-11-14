#!/usr/bin/env bash
set -euo pipefail

# Build script for the Gitopedia Search Lambda.
# Produces website/search-api/dist/search-lambda.zip suitable for deployment via CDK.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEARCH_API_DIR="${ROOT_DIR}/search-api"
DIST_DIR="${SEARCH_API_DIR}/dist"
BUILD_DIR="${SEARCH_API_DIR}/build"

rm -rf "${BUILD_DIR}" "${DIST_DIR}"
mkdir -p "${BUILD_DIR}" "${DIST_DIR}"

echo "Installing Lambda dependencies into build dir..."
python -m pip install --upgrade pip >/dev/null
pip install -r "${SEARCH_API_DIR}/requirements.txt" -t "${BUILD_DIR}" >/dev/null

echo "Copying Lambda handler..."
cp "${SEARCH_API_DIR}/app.py" "${BUILD_DIR}/"

echo "Packaging search-lambda.zip..."
(cd "${BUILD_DIR}" && zip -r "${DIST_DIR}/search-lambda.zip" . >/dev/null)

echo "Search Lambda package created at: ${DIST_DIR}/search-lambda.zip"


