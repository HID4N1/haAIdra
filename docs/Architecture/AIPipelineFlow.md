# CallSight AI Pipeline Flow

This document describes the exact AI pipeline flow implemented in the current codebase.

## Main Components

| Layer | Files | Responsibility |
| --- | --- | --- |
| Frontend | `frontend/src/lib/api.js`, `frontend/src/hooks/useCalls.js`, `frontend/src/hooks/useAnalysis.js` | Upload calls, fetch call status, fetch analysis output, trigger re-analysis. |
| Django calls API | `backend/apps/calls/views.py`, `backend/apps/calls/serializers.py` | Creates call records, uploads audio, creates pipeline jobs, queues analysis. |
| Django analysis API | `backend/apps/analysis/views.py`, `backend/apps/analysis/tasks.py` | Exposes analysis polling/results and manual re-trigger endpoint. |
| Broker | Redis from `docker-compose.yml` | Shared Celery broker/result backend between Django and the AI worker. |
| AI worker | `ai_pipeline/tasks/pipeline.py` | Celery worker that executes transcription, sentiment, topics, scoring, and summary steps. |
| AI DB writer | `ai_pipeline/utils/db.py` | Writes pipeline progress and analysis results directly to PostgreSQL using `psycopg2`. |
| Storage | `backend/apps/calls/storage.py`, `ai_pipeline/utils/s3.py` | Stores uploaded audio and lets the AI worker fetch it by `s3_key`. |

## Runtime Topology

`docker-compose.yml` starts:

1. `postgres`: stores calls, pipeline jobs, transcripts, sentiments, topics, scores, summaries, reviews, agents, and scoring config.
2. `redis`: Celery broker and result backend.
3. `django`: REST API on port `8000`.
4. `celery`: AI pipeline worker built from `ai_pipeline/`, started with:

```bash
celery -A tasks.pipeline worker --loglevel=info --concurrency=2
```

Both Django and the AI worker read `.env`, so they must share the same `REDIS_URL`, database variables, and storage/model settings.

## End-To-End Flow

### 1. User Uploads A Call

Frontend sends a multipart request through:

```text
POST /api/v1/calls/
```

The frontend entry points are:

- `callsApi.upload(formData)` in `frontend/src/lib/api.js`
- `useUploadCall()` in `frontend/src/hooks/useCalls.js`

Expected multipart fields:

| Field | Required | Notes |
| --- | --- | --- |
| `audio` | Yes | Allowed extensions: `wav`, `mp3`, `m4a`, `flac`, `ogg`. |
| `agent_id` | Yes | Validated against the `Agent` table. |
| `language` | No | Defaults to `fr`; supported values are `fr`, `en`, `ar`. |
| `channel` | No | Defaults to `inbound`; supported values are `inbound`, `outbound`. |
| `client_phone` | No | Defaults to empty string. |
| `tags` | No | Stored as JSON. |

### 2. Django Creates The Call Shell

`CallViewSet.create()` in `backend/apps/calls/views.py` does the following:

1. Validates the upload with `CallUploadSerializer`.
2. Creates a `call` row with:
   - `status = pending`
   - company from `request.user.company`
   - selected agent
   - upload metadata such as language, channel, file format, file size, tags.
3. Builds an S3 key using:

```python
s3_storage.build_s3_key(request.user.company.tenant_id, call.id, audio.name)
```

4. Uploads the audio file to storage:

```python
s3_storage.upload_file(audio, s3_key, content_type=audio.content_type)
```

5. Creates an `audio_file` row with:
   - `call`
   - `s3_key`
   - `s3_url`
   - `checksum`
   - `file_size`
6. Creates a `pipeline_job` row for the call.
7. Queues the Celery task:

```python
from apps.analysis.tasks import trigger_analysis
trigger_analysis.delay(str(call.id))
```

8. Sets `pipeline_job.status = queued`.
9. Returns `202 Accepted` with the full `CallSerializer` payload.

### 3. Celery Task Handoff

Django defines a lightweight proxy task in `backend/apps/analysis/tasks.py`:

```python
@shared_task(name="apps.analysis.tasks.trigger_analysis")
def trigger_analysis(self, call_id: str):
    logger.info("Queued analysis for call: %s", call_id)
```

The AI worker defines the real task with the exact same task name in `ai_pipeline/tasks/pipeline.py`:

```python
@app.task(name="apps.analysis.tasks.trigger_analysis")
def trigger_analysis(self, call_id: str):
    ...
```

Because both services use the same Redis broker, Django publishes a task named `apps.analysis.tasks.trigger_analysis`, and the `ai_pipeline` Celery worker consumes it.

## AI Worker Flow

The worker entry point is `trigger_analysis(call_id)` in `ai_pipeline/tasks/pipeline.py`.

### 1. Fetch Call Metadata

The worker calls `get_call(call_id)` from `ai_pipeline/utils/db.py`.

It reads from:

- `call`
- `audio_file`
- `company`

The returned dict includes:

```text
id, company_id, agent_id, language, status, duration, s3_key, tenant_id
```

If the call does not exist, the worker logs and returns. If no `s3_key` exists, it marks the job failed.

### 2. Shared Step Status Update

Before each AI step, the orchestrator calls:

```python
update_step("step_name")
```

This updates:

- `pipeline_job.status = running`
- `pipeline_job.current_step = transcription|sentiment|topics|scoring|summary`
- `pipeline_job.started_at` if it was not already set
- `call.status = processing`

The frontend can poll these fields through:

```text
GET /api/v1/calls/{call_id}/analysis/
GET /api/v1/calls/{call_id}/status/
```

### 3. Step 1: Transcription

File: `ai_pipeline/tasks/transcription.py`

Function:

```python
run_transcription(call)
```

Flow:

1. Fetch audio using `get_audio_file(s3_key)`.
2. Read audio metadata with `get_audio_metadata(audio_path)`.
3. Normalize audio to `16kHz` mono WAV with `normalize_audio(audio_path)`.
4. Optionally apply VAD if `USE_VAD=true`.
5. Run faster-whisper through `get_whisper_model()`.
6. Optionally run pyannote diarization through `get_diarization_model()`.
   - If `HF_TOKEN` is missing or pyannote fails, diarization is disabled.
   - All transcript segments fall back to `SPEAKER_00`.
7. Merge Whisper segments with speaker labels.
8. Mask PII in transcript segments with `mask_segments()`.
   - Regex masking is always used.
   - NER masking is enabled only when `USE_NER_MASKING=true`.
9. Save transcript with `save_transcript()`.
10. Delete temporary audio/WAV/VAD files.

Output shape passed to later steps:

```json
{
  "language": "fr",
  "wer": 0.0,
  "duration": 142.3,
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "speaker": "SPEAKER_00",
      "text": "Bonjour, comment puis-je vous aider?"
    }
  ]
}
```

Database table written:

- `transcript`

### 4. Step 2: Sentiment

File: `ai_pipeline/tasks/sentiment.py`

Function:

```python
run_sentiment(call, transcript_data)
```

Flow:

1. Reads transcript segments from Step 1.
2. Loads the HuggingFace sentiment pipeline through `get_sentiment_model()`.
3. Filters very short segments under `MIN_TEXT_LENGTH = 5`.
4. Runs sentiment classification in batches.
5. Maps model labels to:
   - `positive`
   - `neutral`
   - `negative`
6. Gives skipped/failed segments a neutral fallback.
7. Computes overall sentiment weighted by segment duration.
8. Saves results with `save_sentiment()`.

Output shape:

```json
{
  "label": "positive",
  "score": 0.78,
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "label": "positive",
      "score": 0.92
    }
  ]
}
```

Database table written:

- `sentiment`

### 5. Step 3: Topic Detection

File: `ai_pipeline/tasks/topics.py`

Function:

```python
run_topics(call, transcript_data)
```

Flow:

1. Concatenates transcript text.
2. If the text is longer than `MAX_CHARS = 1500`, keeps beginning, middle, and end snippets.
3. Loads the zero-shot classifier through `get_topic_pipeline()`.
4. Uses default labels unless `TOPIC_LABELS` is set.
5. Runs multi-label zero-shot classification with:

```text
This customer call is about {}.
```

6. Keeps topics with score >= `TOPIC_THRESHOLD`, default `0.3`.
7. Sorts topics by score descending.
8. Saves results with `save_topics()`.

Default topic labels include billing/payment, technical support, complaint, cancellation, refund request, escalation, fraud/security, and others.

Output shape:

```json
[
  { "label": "billing and payment", "score": 0.87 },
  { "label": "complaint", "score": 0.72 }
]
```

Database table written:

- `topic`

### 6. Step 4: Quality Scoring

File: `ai_pipeline/tasks/scoring.py`

Function:

```python
run_scoring(call, transcript_data, sentiment_data)
```

Flow:

1. Fetches the active company scoring config with `get_scoring_config(company_id)`.
2. If no config exists, uses default weights:

| Criterion | Default Weight |
| --- | ---: |
| `accueil` | 20% |
| `empathie` | 20% |
| `resolution` | 20% |
| `langage` | 15% |
| `conformite` | 15% |
| `cloture` | 10% |

3. Converts weights to max scores out of 100.
4. Builds:
   - full transcript text
   - first 30 seconds as opening text
   - last 30 seconds as closing text
   - agent text, assuming `SPEAKER_00` is the agent
5. Scores each criterion using rule-based keyword and sentiment logic:
   - `accueil`: greetings and self-introduction.
   - `empathie`: empathy phrases plus overall sentiment.
   - `resolution`: resolution phrases plus positive ending sentiment.
   - `langage`: starts high and deducts for rude/unprofessional phrases.
   - `conformite`: required compliance phrases.
   - `cloture`: farewell and offer of further help.
6. Sums the criteria into `total`.
7. Saves results with `save_score()`, using `scored_by = ai`.

Output shape:

```json
{
  "config_id": "uuid-or-null",
  "accueil": 18.5,
  "accueil_max": 20.0,
  "empathie": 16.0,
  "empathie_max": 20.0,
  "resolution": 14.0,
  "resolution_max": 20.0,
  "langage": 13.5,
  "langage_max": 15.0,
  "conformite": 12.0,
  "conformite_max": 15.0,
  "cloture": 9.0,
  "cloture_max": 10.0,
  "total": 83.0
}
```

Database table written:

- `score`

### 7. Step 5: Summarization

File: `ai_pipeline/tasks/summarization.py`

Function:

```python
run_summarization(call, transcript_data, score_data, topics)
```

Flow:

1. Builds a readable transcript grouped by speaker.
2. Truncates very long transcript text to `MAX_TRANSCRIPT_CHARS = 3000`.
3. Formats the top detected topics.
4. Formats the score breakdown.
5. Builds a structured prompt asking for exactly four sections:
   - `MOTIF`
   - `ACTIONS`
   - `OUTCOME`
   - `RECOMMENDATIONS`
6. Uses `SUMMARY_LANGUAGE`, default `french`.
7. Generates text through `get_llm_pipeline()`.
8. Parses the output with regex.
9. Saves results with `save_summary()`.

LLM mode is controlled by `LLM_MODEL`:

- Default development mode: `ollama:mistral`
- HuggingFace mode: any configured text-generation model such as Mistral, using `HF_TOKEN` if needed.

Output shape:

```json
{
  "motif": "string",
  "actions": "string",
  "outcome": "string",
  "recommendations": "string"
}
```

Database table written:

- `summary`

### 8. Pipeline Completion

After summarization succeeds, `mark_done()` runs.

It updates:

- `pipeline_job.status = done`
- `pipeline_job.finished_at = now`
- `call.status = analyzed`

Then, if the call has an agent, the worker recalculates agent stats with `update_agent_stats(agent_id)`:

- `agent.total_calls`: count of analyzed calls for the agent.
- `agent.avg_score`: average score total for the agent.

The Celery task returns a compact result:

```json
{
  "call_id": "uuid",
  "status": "done",
  "transcript": 12,
  "sentiment": "positive",
  "topics": 3,
  "score": 83.0
}
```

## Error And Retry Flow

The AI task has:

```text
max_retries = 3
default_retry_delay = 60 seconds
soft_time_limit = 3600 seconds
time_limit = 3900 seconds
```

If any pipeline step raises an exception:

1. The orchestrator logs the error.
2. `_mark_failed(call_id, error)` updates:
   - `pipeline_job.status = failed`
   - `pipeline_job.error_message = first 500 chars of error`
   - `pipeline_job.finished_at = now`
   - `call.status = failed`
3. Celery retries the task if retries remain.
4. If max retries are exceeded, the task returns:

```json
{
  "call_id": "uuid",
  "status": "failed",
  "error": "string"
}
```

Note: the model has a `pipeline_job.retry_count` field, but the current AI worker code does not increment it.

## Polling And Result Retrieval

### Poll Full Analysis Endpoint

Frontend calls:

```text
GET /api/v1/calls/{call_id}/analysis/
```

Implemented by `AnalysisView` in `backend/apps/analysis/views.py`.

If `call.status != analyzed`, the API returns only status data:

```json
{
  "status": "processing",
  "current_step": "sentiment",
  "error": null
}
```

If `call.status == analyzed`, the API returns the full analysis payload:

```json
{
  "transcript": {},
  "sentiment": {},
  "topic": {},
  "score": {},
  "summary": {},
  "qa_review": {}
}
```

Frontend normalization happens in `frontend/src/hooks/useAnalysis.js`.

Important frontend detail: the current `refetchInterval` only polls when `data?.status === 'pending'`. Since the backend can return `processing`, the UI may stop polling while a job is running unless this is adjusted.

### Poll Pipeline Job Endpoint

The call API also exposes:

```text
GET /api/v1/calls/{call_id}/status/
```

This returns the raw `PipelineJobSerializer` shape:

```json
{
  "id": "uuid",
  "status": "queued",
  "current_step": null,
  "retry_count": 0,
  "error_message": "",
  "started_at": null,
  "finished_at": null,
  "created_at": "datetime"
}
```

## Manual Re-Analysis Flow

Managers can re-trigger analysis through:

```text
POST /api/v1/calls/{call_id}/analyze/
```

Implemented by `TriggerAnalysisView` in `backend/apps/analysis/views.py`.

Flow:

1. Fetch call in the current tenant.
2. Reject if `call.status == processing`.
3. Reset `call.status = pending`.
4. Reset or create `pipeline_job`:
   - `status = queued`
   - `current_step = null`
   - `error_message = ""`
   - `retry_count = 0`
   - `started_at = null`
   - `finished_at = null`
5. Queue `trigger_analysis.delay(str(call.id))`.
6. Return call and job IDs.

Existing transcript, sentiment, topic, score, and summary rows are not deleted during re-analysis. The AI worker overwrites them with `ON CONFLICT (call_id) DO UPDATE`.

## Model Loading And Configuration

Models are lazily loaded once per Celery worker process in `ai_pipeline/models/loaders.py`.

| Purpose | Default | Env Override |
| --- | --- | --- |
| Whisper ASR | `large-v3` | `WHISPER_MODEL_SIZE` |
| Diarization | `pyannote/speaker-diarization-3.1` | Requires `HF_TOKEN` |
| Sentiment | `cardiffnlp/twitter-xlm-roberta-base-sentiment` | `SENTIMENT_MODEL` |
| Topics | `facebook/bart-large-mnli` | `TOPIC_MODEL` |
| LLM summary | `ollama:mistral` | `LLM_MODEL` |
| Device | auto-detect CUDA, MPS, CPU | `DEVICE` |

Other relevant env vars:

| Env Var | Effect |
| --- | --- |
| `REDIS_URL` | Celery broker/result backend. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | AI worker direct PostgreSQL connection. |
| `USE_VAD` | Enables audio VAD before Whisper, default `true`. |
| `USE_NER_MASKING` | Enables optional spaCy NER masking, default `false`. |
| `TOPIC_LABELS` | Comma-separated custom topic labels. |
| `TOPIC_THRESHOLD` | Topic confidence cutoff, default `0.3`. |
| `SUMMARY_LANGUAGE` | Summary language, default `french`. |
| `OLLAMA_URL` | Ollama endpoint, default `http://localhost:11434`. |

## Database Write Map

| Pipeline Moment | Function | Table |
| --- | --- | --- |
| Upload starts | `Call.objects.create()` | `call` |
| Audio uploaded | `AudioFile.objects.create()` | `audio_file` |
| Job created | `PipelineJob.objects.create()` | `pipeline_job` |
| Each step starts | `update_pipeline_job()` | `pipeline_job` |
| Each step starts/end/failure | `update_call_status()` | `call` |
| Transcription complete | `save_transcript()` | `transcript` |
| Sentiment complete | `save_sentiment()` | `sentiment` |
| Topics complete | `save_topics()` | `topic` |
| Scoring complete | `save_score()` | `score` |
| Summary complete | `save_summary()` | `summary` |
| Pipeline complete | `update_agent_stats()` | `agent` |

## Status State Machine

Call statuses:

```text
pending -> processing -> analyzed
pending -> processing -> failed
failed -> pending -> processing -> analyzed   # manual re-analysis
analyzed -> pending -> processing -> analyzed # manual re-analysis
```

Pipeline job statuses:

```text
queued -> running -> done
queued -> running -> failed
failed -> queued -> running -> done   # manual re-analysis
done -> queued -> running -> done     # manual re-analysis
```

Pipeline steps:

```text
transcription -> sentiment -> topics -> scoring -> summary
```

## Final Data Seen By The Frontend

After `call.status = analyzed`, the frontend receives:

| UI Field | Backend Source |
| --- | --- |
| Transcript text | `transcript.segments` |
| Sentiment label and score | `sentiment.overall_label`, `sentiment.overall_score` |
| Topics | `topic.topics` |
| Quality score | `score.total` or `score.ai_total` |
| Score breakdown | `score.accueil`, `score.empathie`, `score.resolution`, `score.langage`, `score.conformite`, `score.cloture` |
| Summary | `summary.outcome` / `summary.motif` |
| Coaching notes | `summary.recommendations` / `summary.actions` |

## Important Implementation Notes

- The AI worker does not import Django models. It writes directly to PostgreSQL with raw SQL.
- Analysis records are one-to-one with `call`, and saves use `ON CONFLICT (call_id) DO UPDATE`, so re-analysis overwrites previous AI output.
- Speaker-to-agent mapping assumes `SPEAKER_00` is the agent.
- Diarization is optional and depends on `HF_TOKEN`.
- PII masking is applied before transcript segments are saved.
- The original audio is not modified by PII masking.
- `call.duration` is created as `0` on upload; transcript duration is saved on the `transcript` table. The current worker code does not update `call.duration`.
- The worker marks failed before retrying, so a job may temporarily show `failed` between retry attempts.
- The current frontend polling condition should include `processing` if live progress is expected during analysis.
