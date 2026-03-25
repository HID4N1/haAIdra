# Dashboard API (Metrics)

All endpoints are prefixed with `/api/v1/`.

## Common query param

- `days` (optional, number): defaults to `30`

## Endpoints

### `GET /dashboard/kpi/`

Auth: `Manager+`.

Response `200`: `KPISummarySerializer`:

```json
{
  "period_days": 30,
  "total_calls": 0,
  "analyzed_calls": 0,
  "failed_calls": 0,
  "pending_calls": 0,
  "flagged_calls": 0,
  "avg_score": 0.0,
  "avg_duration": 0.0,
  "resolution_rate": 0.0,
  "analysis_rate": 0.0
}
```

### `GET /dashboard/calls/volume/`

Auth: `Manager+`.

Query params:

- `period` (`daily`|`weekly`|`monthly`, optional, default `daily`)
- `days` (optional)

Response `200`:

- `daily`: list of `{ "date": "date", "count": int }`
- `weekly`: list of `{ "week": "datetime", "count": int }`
- `monthly`: list of `{ "month": "datetime", "count": int }`

### `GET /dashboard/calls/breakdown/`

Auth: `Manager+`.

Query params:

- `by` (`status`|`channel`|`language`|`resolution`, optional, default `status`)
- `days` (optional)

Response `200`: list (depending on `by`) of objects:

- `status`: `{ "status": "string", "count": int }`
- `channel`: `{ "channel": "string", "count": int }`
- `language`: `{ "language": "string", "count": int }`
- `resolution`: `{ "resolution_status": "string", "count": int }`

### `GET /dashboard/calls/duration/`

Auth: `Manager+`.

Query params: `days` (optional)

Response `200`: `CallDurationSerializer`:

```json
{
  "avg_duration": 0.0,
  "min_duration": 0.0,
  "max_duration": 0.0,
  "total_duration": 0.0
}
```

### `GET /dashboard/sentiment/`

Auth: `Manager+`.

Query params: `days` (optional)

Response `200`:

```json
{
  "breakdown": {
    "positive": 0,
    "neutral": 0,
    "negative": 0,
    "total": 0,
    "positive_pct": 0.0,
    "neutral_pct": 0.0,
    "negative_pct": 0.0
  },
  "trend": [
    { "date": "date", "overall_label": "positive|neutral|negative", "count": 0 }
  ],
  "score_trend": [
    { "date": "date", "avg_score": 0.0 }
  ]
}
```

### `GET /dashboard/scores/`

Auth: `Manager+`.

Query params: `days` (optional)

Response `200`:

```json
{
  "summary": {
    "avg_total": 0.0,
    "avg_accueil": 0.0,
    "avg_empathie": 0.0,
    "avg_resolution": 0.0,
    "avg_langage": 0.0,
    "avg_conformite": 0.0,
    "avg_cloture": 0.0,
    "min_total": 0.0,
    "max_total": 0.0
  },
  "trend": [
    { "date": "date", "avg_score": 0.0 }
  ],
  "distribution": [
    { "bucket": "string", "count": 0 }
  ]
}
```

### `GET /dashboard/agents/leaderboard/`

Auth: `Manager+`.

Query params:

- `days` (optional)
- `limit` (optional number, default `10`)

Response `200`: list of agents with:

```json
{
  "id": "uuid",
  "email": "string",
  "department": "string",
  "total_calls": 0,
  "calls_in_period": 0,
  "analyzed_calls": 0,
  "avg_score": 0.0,
  "period_avg_score": 0.0,
  "period_avg_sentiment": 0.0
}
```

### `GET /dashboard/agents/{agent_id}/`

Auth: `QA Supervisor+` (IsQASupervisor).

Query params: `days` (optional)

Response `200`:

```json
{
  "performance": {
    "total_calls": 0,
    "analyzed": 0,
    "flagged": 0,
    "resolved": 0,
    "avg_total": 0.0,
    "avg_accueil": 0.0,
    "avg_empathie": 0.0,
    "avg_resolution": 0.0,
    "avg_langage": 0.0,
    "avg_conformite": 0.0,
    "avg_cloture": 0.0
  },
  "score_trend": [
    { "date": "date", "avg_score": 0.0 }
  ]
}
```

### `GET /dashboard/topics/`

Auth: `Manager+`.

Query params:

- `days` (optional)
- `limit` (optional number, default `20`)

Response `200`: list of `{ "label": "string", "count": int }`.

### `GET /dashboard/qa/`

Auth: `QA Supervisor+`.

Query params: `days` (optional)

Response `200` (`QAStatsSerializer`):

```json
{
  "total": 0,
  "approved": 0,
  "rejected": 0,
  "pending": 0,
  "overridden": 0,
  "avg_override_score": null
}
```

### `GET /dashboard/pipeline/`

Auth: `Manager+`.

Query params: `days` (optional)

Response `200` (`PipelineStatsSerializer`):

```json
{
  "total": 0,
  "queued": 0,
  "running": 0,
  "done": 0,
  "failed": 0,
  "avg_retries": null
}
