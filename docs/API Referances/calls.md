# Calls API

All endpoints are prefixed with `/api/v1/`.

## Call pipeline

### `GET /calls/`

List calls for the current authenticated tenant (tenant-scoped).

Query params (filters/search/ordering):

- Pagination: `page`, `page_size` (default `20`)
- Filters (exact):
  - `agent` (agent UUID), `status`, `language`, `channel`, `is_flagged`, `resolution_status`, `file_format`
- Filters (ranges):
  - `uploaded_at_from` (datetime, ISO 8601)
  - `uploaded_at_to` (datetime, ISO 8601)
  - `score_min`, `score_max` (number; filters by `score.total`)
- Search: `search` (matches `client_phone`, `agent.user.email`, and `tags`)
- Ordering: `ordering` (allowed: `uploaded_at`, `duration`, `status`)

Response `200`: paginated list of `CallListSerializer` items:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "agent": { "id": "uuid", "user": { /* ... */ }, "company": { "id": "uuid", "name": "string", "plan": "free|pro|enterprise" }, "department": "string", "status": "active|inactive", "coaching_notes": "string", "avg_score": 0.0, "total_calls": 0, "created_at": "datetime", "updated_at": "datetime" },
      "language": "fr|en|ar",
      "channel": "inbound|outbound",
      "file_format": "wav|mp3|m4a|flac|ogg",
      "duration": 0,
      "status": "pending|processing|analyzed|failed",
      "is_flagged": false,
      "resolution_status": "resolved|unresolved|escalated",
      "uploaded_at": "datetime",
      "created_at": "datetime"
    }
  ]
}
```

### `POST /calls/`

Upload an audio file and create a call pipeline job.

Request: `multipart/form-data`

Fields:

- `audio` (file): required. Allowed formats checked by extension: `wav`, `mp3`, `m4a`, `flac`, `ogg`.
- `agent_id` (uuid): required
- `language` (string, optional): default `fr` (`fr|en|ar`)
- `channel` (string, optional): default `inbound` (`inbound|outbound`)
- `client_phone` (string, optional, default empty)
- `tags` (array, optional, default empty list). Stored as JSON.

Response `202`:

```json
{
  "id": "uuid",
  "company": "uuid",
  "agent": { /* AgentSerializer */ },
  "uploaded_by": "uuid",
  "client_phone": "string",
  "language": "fr|en|ar",
  "channel": "inbound|outbound",
  "file_format": "wav|mp3|m4a|flac|ogg",
  "file_size": 12345,
  "duration": 0,
  "status": "pending",
  "tags": ["string", "string"],
  "is_flagged": false,
  "resolution_status": "resolved|unresolved|escalated",
  "uploaded_at": "datetime",
  "audio_file": {
    "id": "uuid",
    "s3_key": "string",
    "s3_url": "string",
    "checksum": "string",
    "file_size": 12345,
    "created_at": "datetime"
  },
  "pipeline_job": {
    "id": "uuid",
    "status": "queued|running|done|failed",
    "current_step": "transcription|sentiment|topics|scoring|summary",
    "retry_count": 0,
    "error_message": "",
    "started_at": "datetime|null",
    "finished_at": "datetime|null",
    "created_at": "datetime"
  },
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### `GET /calls/{call_id}/`

Get call detail including pipeline status and analysis sub-objects (when available).

Response `200`:

```json
{ /* `CallSerializer` shape from POST /calls/ */ }
```

### `PATCH /calls/{call_id}/`

Update call metadata (tags/flag/resolution).

Request (`application/json`, partial):

```json
{
  "tags": ["string", "string"],
  "is_flagged": false,
  "resolution_status": "resolved|unresolved|escalated"
}
```

Response `200`: updated fields only (`CallUpdateSerializer`):

```json
{
  "tags": ["string"],
  "is_flagged": false,
  "resolution_status": "resolved|unresolved|escalated"
}
```

### `PUT /calls/{call_id}/`

Same request/response shape as `PATCH /calls/{call_id}/` (updates `tags`, `is_flagged`, `resolution_status`).

### `DELETE /calls/{call_id}/`

Soft delete a call.

Response `204 No Content`.

### `GET /calls/{call_id}/status/`

Get the current Celery pipeline job status for a call.

Response `200`: `PipelineJobSerializer`:

```json
{
  "id": "uuid",
  "status": "queued|running|done|failed",
  "current_step": "transcription|sentiment|topics|scoring|summary|null",
  "retry_count": 0,
  "error_message": "string",
  "started_at": "datetime|null",
  "finished_at": "datetime|null",
  "created_at": "datetime"
}
```

### `POST /calls/{call_id}/flag/`

Toggle the `is_flagged` boolean for the call.

Request: no body required.

Response `200`:

```json
{ "is_flagged": true }
