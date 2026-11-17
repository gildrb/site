# gildrb.com public API

Public, read-only information about gildrb.com. Every endpoint answers anonymous requests.

## Endpoints

- `GET /api/v1` lists the endpoints.
- `GET /api/v1/profile` returns the JSON-LD profile (`/profile.json`).
- `GET /api/v1/status` returns `status`, `service`, `version` and `timestamp`.
- `POST /mcp` is a stateless MCP server (Streamable HTTP) supporting `initialize`, `ping`, `tools/list` and `tools/call`. Metadata: `/.well-known/mcp` and `/.well-known/mcp/server-card.json`.

## Versioning

Versioned endpoints live under `/api/v1/` and every response carries `X-API-Version: v1`. The unversioned `/api/profile` and `/api/status` are deprecated aliases and answer with `Deprecation` and `Sunset` headers.

## Rate limits

Responses advertise `RateLimit-Limit: 60` and `RateLimit-Policy: 60;w=60`. A request over the limit may receive `429 Too Many Requests` with a `Retry-After` header.

## Errors

HTTP errors use RFC 9457 `application/problem+json`:

```json
{
  "type": "https://gildrb.com/api-docs.md#errors",
  "title": "Not Found",
  "status": 404,
  "detail": "Unknown API resource. See https://gildrb.com/api-docs.md for available endpoints.",
  "instance": "/api/v1/nope"
}
```

JSON-RPC errors on `/mcp` use the standard JSON-RPC 2.0 `error` object.

## More

OpenAPI description: `/openapi.json`. Developer overview: `/developers`. Authentication: `/auth.md`.
