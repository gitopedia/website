#!/bin/bash
set -e

# Build the search lambda
echo "Building Search Lambda (Go)..."

cd search-api
mkdir -p dist

# Clean old build
rm -rf dist/*

# Build for AWS Lambda (AL2023 provided runtime)
GOOS=linux GOARCH=amd64 go build -tags lambda.norpc -o dist/bootstrap main.go

# Zip it
cd dist
zip search-lambda.zip bootstrap
echo "Created search-lambda.zip"
