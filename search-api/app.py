#!/usr/bin/env python3
"""
Gitopedia Search Lambda (Python)

This Lambda:
- Downloads the Knowledgebase SQLite FTS index from S3 into /tmp on cold start
- Executes full-text queries against the index
- Returns JSON results suitable for the Gitopedia website search UI

Environment variables:
- INDEX_BUCKET: S3 bucket containing index.sqlite
- INDEX_KEY: S3 key for the SQLite index file (default: index.sqlite)
- CORS_ORIGIN: Allowed origin for CORS (e.g. https://gitopedia.org or *)
"""

import json
import os
import sqlite3
import tempfile
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

S3 = boto3.client("s3")

INDEX_BUCKET = os.environ.get("INDEX_BUCKET")
INDEX_KEY = os.environ.get("INDEX_KEY", "index.sqlite")
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "*")

_DB_PATH: Optional[str] = None


def _get_db_path() -> str:
    """
    Ensure the SQLite index is available on the local filesystem and return its path.
    Downloads from S3 to /tmp on cold start if necessary.
    """
    global _DB_PATH

    if _DB_PATH and os.path.exists(_DB_PATH):
        return _DB_PATH

    if not INDEX_BUCKET:
        raise RuntimeError("INDEX_BUCKET environment variable is not set")

    # Use a deterministic filename under /tmp so subsequent invocations can reuse it.
    local_path = os.path.join(tempfile.gettempdir(), "gitopedia-index.sqlite")

    if not os.path.exists(local_path):
        try:
            S3.download_file(INDEX_BUCKET, INDEX_KEY, local_path)
        except (BotoCoreError, ClientError) as e:
            raise RuntimeError(f"Failed to download index from S3: {e}") from e

    _DB_PATH = local_path
    return _DB_PATH


def _search_index(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Execute a full-text search against the index.sqlite FTS table.
    Schema:
      - articles(id TEXT PRIMARY KEY, title TEXT, path TEXT, author TEXT, summary TEXT, tags TEXT, meta_json TEXT)
      - article_index(content, title, summary, tags, id UNINDEXED)
    """
    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        # FTS5 query
        # We explicitly select columns from 'articles' to return metadata.
        # We snippet 'content' (column 0 in FTS table).
        sql = """
        SELECT a.id, a.title, a.path, a.summary, a.tags, a.author,
               snippet(article_index, 0, '<b>', '</b>', ' ... ', 15) AS snippet
        FROM article_index
        JOIN articles a ON article_index.id = a.id
        WHERE article_index MATCH ?
        ORDER BY rank
        LIMIT ?
        """
        cur = conn.execute(sql, (query, limit))
        rows = cur.fetchall()
        results: List[Dict[str, Any]] = []
        for row in rows:
            # Parse tags JSON if possible, otherwise return as string/list
            tags = row["tags"]
            try:
                if tags:
                    tags = json.loads(tags)
            except:
                pass

            results.append(
                {
                    "id": row["id"],
                    "title": row["title"],
                    "path": row["path"],
                    "summary": row["summary"],
                    "author": row["author"],
                    "tags": tags,
                    "snippet": row["snippet"],
                }
            )
        return results
    finally:
        conn.close()


def _build_response(body: Dict[str, Any], status_code: int = 200) -> Dict[str, Any]:
    """Build an API Gateway compatible HTTP response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": CORS_ORIGIN,
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body),
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda entrypoint.
    """
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS" or event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return _build_response({"ok": True})

    params = event.get("queryStringParameters") or {}
    raw_query = params.get("q") or ""
    tag_filter = params.get("tag")

    # Build FTS query
    # If user provides "q", use it.
    # If user provides "tag", append it as filter: tags:"value"
    
    parts = []
    if raw_query.strip():
        parts.append(raw_query.strip())
    
    if tag_filter and tag_filter.strip():
        # Escape quotes in tag to prevent query syntax errors
        safe_tag = tag_filter.replace('"', '""')
        parts.append(f'tags:"{safe_tag}"')
    
    final_query = " AND ".join(parts)

    if not final_query.strip():
        return _build_response({"results": [], "error": "Missing query parameter 'q' or 'tag'."}, status_code=400)

    # Optional limit parameter
    limit_param = params.get("limit")
    try:
        limit = int(limit_param) if limit_param is not None else 10
    except ValueError:
        limit = 10
    limit = max(1, min(limit, 50))

    try:
        results = _search_index(query=final_query, limit=limit)
        return _build_response(
            {
                "results": results,
                "count": len(results),
                "query": final_query
            }
        )
    except Exception as e:
        # Log error (print to CloudWatch)
        print(f"Search error: {e}")
        return _build_response({"results": [], "error": "Internal search error."}, status_code=500)
