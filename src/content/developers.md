# gildrb.com developer resources

Everything here is public and read-only and answers anonymous requests; see [auth.md](/auth.md).

## Markdown

Every page is also available as Markdown: request it with `Accept: text/markdown`, or read the sources under `/content/`. [llms.txt](/llms.txt) indexes the site, and [llms-full.txt](/llms-full.txt) holds all of it in one file.

## API

- `GET /api/v1` lists the endpoints.
- `GET /api/v1/profile` returns the structured JSON-LD profile.
- `GET /api/v1/status` reports that the API is up.

Errors use `application/problem+json`. See [api-docs.md](/api-docs.md), [openapi.json](/openapi.json) and the [API catalog](/.well-known/api-catalog).

## MCP

`POST https://gildrb.com/mcp` is a read-only MCP server (Streamable HTTP) with two tools, `list_portfolio_pages` and `get_portfolio_page`. Its manifest is at [/.well-known/mcp](/.well-known/mcp) and its server card at [/.well-known/mcp/server-card.json](/.well-known/mcp/server-card.json).

## Source

The site’s source is at [github.com/gildrb/gildrb.com](https://github.com/gildrb/gildrb.com).
