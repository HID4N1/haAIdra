# ═══════════════════════════════════════════════════════
# haAIdra AI — Makefile
# Dev mode: PostgreSQL + Redis in Docker
#           Django + Celery run natively
# ═══════════════════════════════════════════════════════

# ── Infrastructure (Docker) ────────────────────────────
infra:
	docker-compose up postgres redis

infra-detached:
	docker-compose up -d postgres redis

infra-stop:
	docker-compose stop postgres redis

infra-logs:
	docker-compose logs -f postgres redis

# ── Django (native) ────────────────────────────────────
run:
	cd backend && python3 manage.py runserver

shell:
	cd backend && python3 manage.py shell

migrate:
	cd backend && python3 manage.py migrate

makemigrations:
	cd backend && python3 manage.py makemigrations

createsuperuser:
	cd backend && python3 manage.py createsuperuser

seed-demo:
	cd backend && python3 manage.py seed_demo_data --calls 72

collectstatic:
	cd backend && python3 manage.py collectstatic --noinput

# ── Celery (native) ────────────────────────────────────
worker:
	cd ai_pipeline && celery -A tasks.pipeline worker --loglevel=info --concurrency=2

worker-solo:
	cd ai_pipeline && celery -A tasks.pipeline worker --loglevel=info --concurrency=1 --pool=solo

# ── Tests ──────────────────────────────────────────────
test:
	cd backend && pytest tests/

test-coverage:
	cd backend && pytest tests/ --cov=apps --cov-report=html

test-users:
	cd backend && pytest tests/users/

test-calls:
	cd backend && pytest tests/calls/

test-analysis:
	cd backend && pytest tests/analysis/

# ── Frontend (native) ──────────────────────────────────
frontend:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-preview:
	cd frontend && npm run preview

# ── Full production (Docker) ───────────────────────────
prod:
	docker-compose up --build -d

prod-stop:
	docker-compose down

prod-logs:
	docker-compose logs -f

prod-logs-django:
	docker-compose logs -f django

prod-logs-celery:
	docker-compose logs -f celery

# ── Database utils ─────────────────────────────────────
db-reset:
	docker-compose stop postgres
	docker-compose rm -f postgres
	docker volume rm callsight-ai_postgres_data
	docker-compose up -d postgres

db-shell:
	docker-compose exec postgres psql -U ${DB_USER} -d ${DB_NAME}

# ── Clean ──────────────────────────────────────────────
clean:
	docker-compose down -v --remove-orphans
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

.PHONY: infra infra-detached infra-stop infra-logs \
        run shell migrate makemigrations createsuperuser seed-demo collectstatic \
        worker worker-solo \
        test test-coverage test-users test-calls test-analysis \
        frontend frontend-build frontend-preview \
        prod prod-stop prod-logs prod-logs-django prod-logs-celery \
        db-reset db-shell clean
