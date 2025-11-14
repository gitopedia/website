# Gitopedia Search API (Lambda)

This directory contains the Python code for the Gitopedia Search Lambda. The function:

- Downloads the Knowledgebase SQLite full-text index (`index.sqlite`) from S3
- Executes full-text queries using SQLite FTS
- Returns JSON search results to the Gitopedia website

The Lambda is deployed by the Solus CDK stack (`GitopediaStack`) and exposed via an API Gateway
`/search` endpoint. The website frontend calls this API to implement search.

## Environment variables

- `INDEX_BUCKET`: S3 bucket containing the Knowledgebase index
- `INDEX_KEY`: S3 key for the index file (defaults to `index.sqlite`)
- `CORS_ORIGIN`: Allowed CORS origin (e.g. `https://gitopedia.org` or `*`)

## Local development

For local testing you can:

1. Create a virtualenv and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Download an `index.sqlite` from the Knowledgebase S3 bucket to a local file and set:

```bash
export INDEX_BUCKET=local
export INDEX_KEY=index.sqlite
```

3. Temporarily change `_get_db_path` in `app.py` to point at your local file, or mock S3 in tests.

The actual packaging and deployment are handled by the website CI and the Solus CDK stack.


