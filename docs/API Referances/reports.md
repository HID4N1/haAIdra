# Reports API (PDF/Excel)

All endpoints are prefixed with `/api/v1/`.

Reports are generated server-side and returned as a file download (binary HTTP response).

## Common query params

- `format` (`pdf`|`excel`|`csv`): `pdf` generates a PDF. `excel` and `csv` return an Excel file (current implementation).
- Date range (either):
  - `month=<1-12>&year=<YYYY>` OR
  - `from=<YYYY-MM-DD>&to=<YYYY-MM-DD>`
- If omitted, date range defaults to the current month.

## Endpoints

### `GET /reports/company/`

Company monthly report.

Auth: `Manager+`.

Extra query params: none.

Response: file download

- PDF: `Content-Type: application/pdf`
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### `GET /reports/agent/{agent_id}/`

Agent monthly report.

Auth: `Manager+`.

Query params: same common params.

### `GET /reports/call-quality/`

Call quality report.

Auth: `Manager+`.

Query params:

- `agent_id` (optional UUID): scope the report to one agent

### `GET /reports/sentiment/`

Sentiment analysis report.

Auth: `Manager+`.

Query params:

- `agent_id` (optional UUID)

### `GET /reports/qa/`

QA review report.

Auth: `QA Supervisor+`.

### `GET /reports/scores/`

Score performance report.

Auth: `Manager+`.

Query params:

- `agent_id` (optional UUID)

### `GET /reports/flagged/`

Flagged calls report.

Auth: `Manager+`.

Query params:

- `agent_id` (optional UUID)

### `GET /reports/topics/`

Topic frequency report.

Auth: `Manager+`.

Query params:

- `limit` (optional number, default `20`)
- `agent_id` (optional UUID)

### `GET /reports/comparative/`

Comparative report across multiple agents.

Auth: `Manager+`.

Query params:

- `agent_ids` (optional): comma-separated UUIDs, e.g. `uuid1,uuid2`
  - If missing, compares all active agents.

## Error responses

If report generation fails, the server returns JSON like:

```json
{ "detail": "Report generation failed.", "error": "string" }
```

or:

```json
{ "detail": "string" }
