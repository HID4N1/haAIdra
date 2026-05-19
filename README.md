# haAIdra / CallSight AI

AI Call Intelligence Platform for call centers. This academic MVP analyzes uploaded customer calls and turns them into manager-ready coaching signals: transcription, sentiment, topic detection, quality scoring, AI summary, agent analytics, and dashboard KPIs.

## Stack

- Frontend: React, Vite, TanStack Query, Recharts, Tailwind
- Backend: Django REST Framework
- Worker: Celery AI pipeline
- Broker: Redis
- Database: PostgreSQL in Docker, SQLite-friendly for local backend experiments
- Storage: S3-compatible audio storage abstraction
- AI: faster-whisper/Whisper, sentiment model, zero-shot topics, rule-based scoring, LLM summary

## Run With Docker

1. Copy environment values:

```bash
cp .env.example .env
```

2. For a fast academic demo, keep:

```bash
MOCK_AI_PIPELINE=true
```

3. Start infrastructure and services:

```bash
docker compose up --build
```

4. Prepare backend data:

```bash
docker compose exec django python manage.py migrate
docker compose exec django python manage.py seed_demo_data
```

5. Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Demo login after seeding:

- `manager@haaidra.test` / `DemoPass123!`
- `qa@haaidra.test` / `DemoPass123!`
- `admin@haaidra.test` / `DemoPass123!`

## Core API Endpoints

- `POST /api/v1/calls/` upload audio with `audio`, `agent_id`, optional `language`, `channel`, `client_phone`, `tags`
- `GET /api/v1/calls/` list tenant-scoped calls
- `GET /api/v1/calls/{id}/` call detail
- `GET /api/v1/calls/{id}/status/` pipeline job status and progress
- `GET /api/v1/calls/{id}/analysis/` full or in-progress analysis payload
- `POST /api/v1/calls/{id}/analyze/` re-run analysis
- `GET /api/v1/dashboard/kpi/`
- `GET /api/v1/dashboard/scores/`
- `GET /api/v1/dashboard/sentiment/`
- `GET /api/v1/dashboard/topics/`
- `GET /api/v1/dashboard/agents/leaderboard/`
- `GET /api/v1/agents/`

All tenant-facing endpoints filter by the authenticated user's company.

## Pipeline Lifecycle

Call status:

```text
pending -> processing -> analyzed
pending -> processing -> failed
```

Pipeline job status:

```text
queued -> running -> done
queued -> running -> failed
```

Pipeline steps:

```text
transcription -> sentiment -> topics -> scoring -> summary
```

The frontend polls while status is `pending`, `queued`, `processing`, or `running`, and stops on `analyzed`, `done`, or `failed`.

## Demo Data

Use:

```bash
python manage.py seed_demo_data
```

It creates a demo company, manager, QA user, agents, analyzed calls, transcript segments, sentiments, topics, scores, summaries, QA reviews, and a few pending/processing/failed calls for UI states.

## Mock AI Mode

`MOCK_AI_PIPELINE=true` makes the Celery worker generate realistic fake outputs without loading heavy ML models. This is best for demos, evaluation, and UI testing. Set it to `false` to run the real AI pipeline.

## Known Limitations

- MVP diarization assumes `SPEAKER_00` is the agent and `SPEAKER_01` is the customer.
- Rule-based scoring is designed for demo clarity, not audited QA compliance.
- Mock summaries are deterministic and should not be presented as real model output.
- S3/local storage behavior depends on environment configuration.
- Real model mode requires the relevant model dependencies, compute, and optional Hugging Face token.

## Demo Script

1. Log in as `manager@haaidra.test`.
2. Open the dashboard and show total calls, failed calls, score trend, top agents, coaching priority, topics, and recent calls.
3. Open Calls, filter by failed or processing, then open a call detail.
4. Explain the pipeline progress bar and step labels.
5. Upload a small audio file with an agent, language, channel, phone, and tags.
6. With `MOCK_AI_PIPELINE=true`, wait for analysis to complete and show transcript, sentiment, topics, score breakdown, and summary.
7. Click Re-analyze to demonstrate repeatable analysis and latest-result refresh.

Screenshot placeholders can be placed under `docs/screenshots/` for the final report.
