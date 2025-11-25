package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	_ "modernc.org/sqlite"
)

var (
	dbPath     string
	indexBucket = os.Getenv("INDEX_BUCKET")
	indexKey    = os.Getenv("INDEX_KEY")
	corsOrigin  = os.Getenv("CORS_ORIGIN")
)

func init() {
	if indexKey == "" {
		indexKey = "index.sqlite"
	}
	if corsOrigin == "" {
		corsOrigin = "*"
	}
}

type SearchResult struct {
	ID      string          `json:"id"`
	Title   string          `json:"title"`
	Path    string          `json:"path"`
	Summary string          `json:"summary"`
	Author  string          `json:"author"`
	Tags    json.RawMessage `json:"tags"`
	Snippet string          `json:"snippet"`
}

func downloadIndex(ctx context.Context) (string, error) {
	if dbPath != "" {
		if _, err := os.Stat(dbPath); err == nil {
			return dbPath, nil
		}
	}

	if indexBucket == "" {
		return "", fmt.Errorf("INDEX_BUCKET not set")
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return "", err
	}
	s3Client := s3.NewFromConfig(cfg)

	tmp := os.TempDir()
	localPath := filepath.Join(tmp, "gitopedia-index.sqlite")

	// Check existence
	if _, err := os.Stat(localPath); err == nil {
		dbPath = localPath
		return dbPath, nil
	}

	out, err := os.Create(localPath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	resp, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &indexBucket,
		Key:    &indexKey,
	})
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if _, err := io.Copy(out, resp.Body); err != nil {
		return "", err
	}

	dbPath = localPath
	return dbPath, nil
}

func search(ctx context.Context, query string, limit int) ([]SearchResult, error) {
	path, err := downloadIndex(ctx)
	if err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	// FTS query
	sqlQuery := `
		SELECT a.id, a.title, a.path, a.summary, a.tags, a.author,
		       snippet(article_index, 0, '<b>', '</b>', ' ... ', 15)
		FROM article_index
		JOIN articles a ON article_index.id = a.id
		WHERE article_index MATCH ?
		ORDER BY rank
		LIMIT ?
	`

	rows, err := db.QueryContext(ctx, sqlQuery, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var r SearchResult
		var tagsStr sql.NullString
		var author sql.NullString
		var summary sql.NullString

		if err := rows.Scan(&r.ID, &r.Title, &r.Path, &summary, &tagsStr, &author, &r.Snippet); err != nil {
			return nil, err
		}
		if tagsStr.Valid {
			r.Tags = json.RawMessage(tagsStr.String)
		}
		if author.Valid {
			r.Author = author.String
		}
		if summary.Valid {
			r.Summary = summary.String
		}
		results = append(results, r)
	}
	return results, nil
}

func handleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Handle CORS preflight
	if request.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  corsOrigin,
				"Access-Control-Allow-Methods": "GET,OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		}, nil
	}

	q := request.QueryStringParameters["q"]
	tag := request.QueryStringParameters["tag"]

	// Construct query
	var parts []string
	if strings.TrimSpace(q) != "" {
		parts = append(parts, strings.TrimSpace(q))
	}
	if strings.TrimSpace(tag) != "" {
		safeTag := strings.ReplaceAll(tag, "\"", "\"\"")
		parts = append(parts, fmt.Sprintf("tags:\"%s\"", safeTag))
	}
	
	finalQuery := strings.Join(parts, " AND ")

	if finalQuery == "" {
		return response(400, map[string]string{"error": "Missing query parameter 'q' or 'tag'"}), nil
	}

	limitStr := request.QueryStringParameters["limit"]
	limit := 10
	if limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil {
			limit = v
		}
	}
	if limit > 50 {
		limit = 50
	}
	if limit < 1 {
		limit = 1
	}

	results, err := search(ctx, finalQuery, limit)
	if err != nil {
		log.Printf("Search error: %v", err)
		return response(500, map[string]string{"error": "Internal search error"}), nil
	}

	return response(200, map[string]interface{}{
		"results": results,
		"count":   len(results),
		"query":   finalQuery,
	}), nil
}

func response(code int, body interface{}) events.APIGatewayProxyResponse {
	b, _ := json.Marshal(body)
	return events.APIGatewayProxyResponse{
		StatusCode: code,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  corsOrigin,
			"Access-Control-Allow-Methods": "GET,OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
		Body: string(b),
	}
}

func main() {
	lambda.Start(handleRequest)
}

