package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	_ "modernc.org/sqlite"
)

var (
	dbPath      string
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
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)
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

func search(ctx context.Context, query string, limit, offset int) ([]SearchResult, error) {
	path, err := downloadIndex(ctx)
	if err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	// FTS query with bm25 ranking and pagination
	// Weights: content=1.0, title=10.0, summary=5.0, tags=2.0
	sqlQuery := `
		SELECT a.id, a.title, a.path, a.summary, a.tags, a.author,
		       snippet(article_index, 0, '<b>', '</b>', ' ... ', 15)
		FROM article_index
		JOIN articles a ON article_index.id = a.id
		WHERE article_index MATCH ?
		ORDER BY bm25(article_index, 1.0, 10.0, 5.0, 2.0)
		LIMIT ? OFFSET ?
	`

	rows, err := db.QueryContext(ctx, sqlQuery, query, limit, offset)
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

	if request.QueryStringParameters["action"] == "tags" {
		return handleTags(ctx)
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

	pageStr := request.QueryStringParameters["page"]
	page := 1
	if pageStr != "" {
		if v, err := strconv.Atoi(pageStr); err == nil && v > 0 {
			page = v
		}
	}
	offset := (page - 1) * limit

	results, err := search(ctx, finalQuery, limit, offset)
	if err != nil {
		slog.Error("Search error", "err", err)
		return response(500, map[string]string{"error": "Internal search error"}), nil
	}

	return response(200, map[string]interface{}{
		"results": results,
		"count":   len(results),
		"page":    page,
		"query":   finalQuery,
	}), nil
}

func handleTags(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	path, err := downloadIndex(ctx)
	if err != nil {
		return response(500, map[string]string{"error": "Failed to load index"}), nil
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return response(500, map[string]string{"error": "Failed to open DB"}), nil
	}
	defer db.Close()

	rows, err := db.QueryContext(ctx, "SELECT tags FROM articles")
	if err != nil {
		return response(500, map[string]string{"error": "Query failed"}), nil
	}
	defer rows.Close()

	counts := make(map[string]int)
	for rows.Next() {
		var tagsStr string
		if err := rows.Scan(&tagsStr); err != nil {
			continue
		}
		var tags []string
		if err := json.Unmarshal([]byte(tagsStr), &tags); err == nil {
			for _, t := range tags {
				counts[t]++
			}
		}
	}

	type Tag struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}
	var result []Tag
	for k, v := range counts {
		result = append(result, Tag{Name: k, Count: v})
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].Count == result[j].Count {
			return result[i].Name < result[j].Name
		}
		return result[i].Count > result[j].Count
	})

	return response(200, result), nil
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
			"Strict-Transport-Security":    "max-age=63072000; includeSubDomains; preload",
			"X-Content-Type-Options":       "nosniff",
			"X-Frame-Options":              "DENY",
			"Content-Security-Policy":      "default-src 'none'; frame-ancestors 'none'",
		},
		Body: string(b),
	}
}

func main() {
	lambda.Start(handleRequest)
}
