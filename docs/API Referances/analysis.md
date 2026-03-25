# Analysis & QA Reviews API

All endpoints are prefixed with `/api/v1/`.

## Call analysis

### `GET /calls/{call_id}/analysis/`

Fetch full AI analysis for a call, or (while analysis is running) return polling status.

Response (when `call.status != analyzed`) `200`:

```json
{
  "status": "pending|processing|failed",
  "current_step": "transcription|sentiment|topics|scoring|summary|null",
  "error": "string|null"
}
```

If the pipeline job record does not exist yet, response is:

```json
{ "status": "pending|processing|failed" }
```

Response (when `call.status == analyzed`) `200`:

```json
{
  "transcript": {
    "id": "uuid",
    "call": "uuid",
    "language_detected": "string",
    "word_error_rate": 0.0,
    "duration": 0.0,
    "segments": [
      { "start": 0.0, "end": 0.0, "speaker": "string", "text": "string" }
    ],
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "sentiment": {
    "id": "uuid",
    "call": "uuid",
    "overall_label": "positive|neutral|negative",
    "overall_score": 0.0,
    "segments": [
      { "start": 0.0, "end": 0.0, "label": "positive|neutral|negative", "score": 0.0 }
    ],
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "topic": {
    "id": "uuid",
    "call": "uuid",
    "topics": [
      { "label": "string", "score": 0.0 }
    ],
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "score": {
    "id": "uuid",
    "call": "uuid",
    "config": "uuid|null",
    "accueil": 0.0,
    "accueil_max": 20.0,
    "empathie": 0.0,
    "empathie_max": 20.0,
    "resolution": 0.0,
    "resolution_max": 20.0,
    "langage": 0.0,
    "langage_max": 15.0,
    "conformite": 0.0,
    "conformite_max": 15.0,
    "cloture": 0.0,
    "cloture_max": 10.0,
    "total": 0.0,
    "ai_total": 0.0,
    "scored_by": "ai|manual|hybrid",
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "summary": {
    "id": "uuid",
    "call": "uuid",
    "motif": "string",
    "actions": "string",
    "outcome": "string",
    "recommendations": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "qa_review": {
    "id": "uuid",
    "call": "uuid",
    "reviewer": "uuid|null",
    "score_override": 0.0,
    "original_ai_score": 0.0,
    "is_overridden": false,
    "override_reason": "string",
    "comment": "string",
    "status": "pending|approved|rejected",
    "reviewed_at": "datetime|null",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

### `POST /calls/{call_id}/analyze/`

Manually re-trigger the AI pipeline for a call.

Request: no body required.

Response `200`:

```json
{
  "detail": "Analysis triggered.",
  "call_id": "uuid",
  "job_id": "uuid"
}
```

## QA reviews

### `GET /reviews/?status={pending|approved|rejected}`

List QA reviews (tenant-scoped).

Query params:

- `status` (optional)

Response `200`: paginated list of `QAReviewSerializer` objects.

### `GET /reviews/{review_id}/`

Get QA review detail.

Response `200`: `QAReviewSerializer`.

### `PATCH /reviews/{review_id}/`

Override QA review result (score override, approval/rejection, add comments).

Request (`application/json`, partial):

```json
{
  "score_override": 0.0,
  "override_reason": "string",
  "comment": "string",
  "status": "pending|approved|rejected"
}
```

### `PUT /reviews/{review_id}/`

Same request/response shape as `PATCH /reviews/{review_id}/`.

### `DELETE /reviews/{review_id}/`

Delete a QA review record.

Response `204 No Content`.

### `POST /reviews/` (created review)

This endpoint is available via the DRF router, but `QAReview.call` is not writable via `QAReviewSerializer` (it is read-only).

Request (`application/json`) would only accept:

```json
{
  "score_override": 0.0,
  "override_reason": "string",
  "comment": "string",
  "status": "pending|approved|rejected"
}
```

In practice, creating reviews via this endpoint may fail unless the server provides `call` linkage elsewhere.

Response `200`: only the updatable fields (`QAReviewUpdateSerializer`):

```json
{
  "score_override": 0.0,
  "override_reason": "string",
  "comment": "string",
  "status": "pending|approved|rejected"
}
