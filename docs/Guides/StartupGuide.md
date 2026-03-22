# CallSight AI — Full Project Startup Guide

## What you need running to work on this project

| Service | How it runs | Port |
|---------|-------------|------|
| PostgreSQL | Docker | 5432 |
| Redis | Docker | 6379 |
| Django API | Native (venv) | 8000 |
| Celery Worker | Native (venv) | — |
| React Frontend | Native (npm) | 5173 |

---

## First time setup (do this once)

### Step 1 — Clone and configure

```bash
git clone https://github.com/your-username/CALLSIGHT_AI.git
cd CALLSIGHT_AI
cp .env.example .env
```

Open `.env` and set:

```env
SECRET_KEY=any-random-string-here
DB_NAME=callsight
DB_USER=callsight_user
DB_PASSWORD=callsight_pass
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

> Keep `DB_HOST=localhost` for dev mode.
> Only change it to `DB_HOST=postgres` for full Docker production.

---

### Step 2 — Start infrastructure

```bash
make infra-detached
```

Verify both containers are up:

```bash
docker-compose ps
```

Expected output:
NAME                STATUS
callsight-postgres  Up (healthy)
callsight-redis     Up (healthy)

---

### Step 3 — Backend setup

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

Run migrations:

```bash
cd ..
make migrate
```

Create your admin account:

```bash
make createsuperuser
```

---

### Step 4 — AI Pipeline setup

```bash
cd ai_pipeline
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

> The first time you start the Celery worker it will download ML models.
> This can take 5–15 minutes. Models are cached after the first download.

---

### Step 5 — Frontend setup

```bash
cd frontend
npm install
cd ..
```

---

## Every day — starting the project

Open **4 terminals** in your project root:

### Terminal 1 — Infrastructure

```bash
make infra-detached
```

> Skip this if Docker containers are already running.
> Check with `docker-compose ps`.

---

### Terminal 2 — Django API

```bash
cd backend
source venv/bin/activate
cd ..
make run
```

Wait for:
Starting development server at http://127.0.0.1:8000/

---

### Terminal 3 — Celery Worker

```bash
cd ai_pipeline
source venv/bin/activate
cd ..
make worker
```

Wait for:

[celery@hostname] ready.
Connected to redis://localhost:6379/0

> Only needed if you are working on the AI pipeline.
> Skip if you are only working on frontend or backend API.

---

### Terminal 4 — Frontend

```bash
make frontend
```

Wait for:
VITE ready in Xms
➜ Local: http://localhost:5173/

---

## Verify everything is working

| Check | URL | Expected |
|-------|-----|----------|
| Django API | http://localhost:8000/api/ | JSON response |
| Django Admin | http://localhost:8000/admin/ | Login page |
| Frontend | http://localhost:5173/ | React app |
| PostgreSQL | localhost:5432 | Accessible via pgAdmin or DBeaver |
| Redis | localhost:6379 | Accessible via Redis CLI |

---

## Stopping the project

### Stop frontend and Django

Press `Ctrl+C` in their terminals.

### Stop Celery

Press `Ctrl+C` in the Celery terminal.

### Stop infrastructure

```bash
make infra-stop
```

### Stop everything and clean up

```bash
make clean
```

> Warning: `make clean` removes all Docker volumes including your database data.
> Only use it when you want a completely fresh start.

---

## Common issues

### PostgreSQL: connection refused

```bash
# Check if container is running
docker-compose ps

# If not running, start it
make infra-detached

# If it is running but Django can't connect
# Make sure DB_HOST=localhost in your .env (not 'postgres')
```

### Django: no module named 'xxx'

```bash
# Make sure venv is activated
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Celery: can't connect to Redis

```bash
# Check Redis container
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Expected: PONG
```

### Frontend: API calls failing (CORS)

```bash
# Make sure Django is running on port 8000
make run

# Check vite.config.js has the proxy configured:
# proxy: { '/api': 'http://localhost:8000' }
```

### Migrations: table already exists

```bash
# Reset the database (dev only — loses all data)
make db-reset
make migrate
```

### Port already in use

```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

---

## Makefile quick reference

### Infrastructure

| Command | Action |
|---------|--------|
| `make infra` | Start PostgreSQL + Redis (with logs) |
| `make infra-detached` | Start PostgreSQL + Redis (background) |
| `make infra-stop` | Stop PostgreSQL + Redis |

### Backend

| Command | Action |
|---------|--------|
| `make run` | Start Django dev server |
| `make migrate` | Apply migrations |
| `make makemigrations` | Create new migrations |
| `make createsuperuser` | Create admin user |
| `make shell` | Open Django shell |

### AI Pipeline

| Command | Action |
|---------|--------|
| `make worker` | Start Celery worker |
| `make worker-solo` | Start Celery worker (single thread, easier to debug) |

### Frontend

| Command | Action |
|---------|--------|
| `make frontend` | Start React dev server |
| `make frontend-build` | Build for production |

### Tests

| Command | Action |
|---------|--------|
| `make test` | Run all tests |
| `make test-users` | Run users tests only |
| `make test-calls` | Run calls tests only |
| `make test-analysis` | Run analysis tests only |
| `make test-coverage` | Run tests with coverage report |

### Database

| Command | Action |
|---------|--------|
| `make db-shell` | Open PostgreSQL shell |
| `make db-reset` | Wipe and recreate database |

### Cleanup

| Command | Action |
|---------|--------|
| `make clean` | Stop everything + remove volumes |

---

## Project structure reminder

callsight-ai/
├── .env                    ← your local env vars (never commit)
├── .env.example            ← env vars template (committed)
├── docker-compose.yml      ← PostgreSQL + Redis containers
├── Makefile                ← all shortcuts
├── backend/                ← Django REST API
│   ├── venv/               ← Python virtual env (never commit)
│   ├── config/             ← settings, urls, celery, wsgi
│   ├── apps/               ← users, calls, analysis, dashboard, reports, core
│   └── tests/              ← pytest test suite
├── ai_pipeline/            ← Celery workers + ML models
│   ├── venv/               ← Python virtual env (never commit)
│   ├── tasks/              ← pipeline, transcription, sentiment, topics, scoring, summary
│   ├── models/             ← loaders, pii_masker
│   └── utils/              ← audio, s3, db
├── frontend/               ← React + Vite SPA
│   ├── src/
│   │   ├── pages/          ← all pages by role
│   │   ├── components/     ← layout, calls, analysis
│   │   ├── hooks/          ← useAuth, useCalls, useAnalysis, useDashboard
│   │   └── lib/            ← api.js, auth.js, queryClient.js
├── infra/                  ← nginx.conf, deploy.sh
├── .github/workflows/      ← ci.yml, deploy.yml
└── docs/                   ← all documentation
    ├── STARTUP.md          ← this file
    ├── DEV_SETUP.md        ← first time setup
    └── DEV_WORKFLOW.md     ← daily workflow guide
