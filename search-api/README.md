# Gitopedia Search API (Lambda)

This directory contains the Go code for the Gitopedia Search Lambda. The function:

- Downloads the Knowledgebase SQLite full-text index (`index.sqlite`) from S3
- Executes full-text queries using SQLite FTS
- Returns JSON search results to the Gitopedia website

The Lambda is deployed by the Solus CDK stack (`GitopediaStack`) using the `provided.al2023` runtime and exposed via an API Gateway `/search` endpoint.

## Environment variables

- `INDEX_BUCKET`: S3 bucket containing the Knowledgebase index
- `INDEX_KEY`: S3 key for the index file (defaults to `index.sqlite`)
- `CORS_ORIGIN`: Allowed CORS origin (e.g. `https://gitopedia.org` or `*`)

## Local development

1. Install Go.
2. Run `go mod tidy`.
3. Build: `go build -o bootstrap main.go`.
