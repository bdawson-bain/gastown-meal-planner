# Forma

A macro-aware meal planner for fitness-focused singles.

## Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- Python 3.12+ (only needed to generate `ENCRYPTION_KEY` — see below)

### Quick start

```bash
# 1. Clone the repo
git clone <repo-url> gastownmeals
cd gastownmeals

# 2. Create your .env file
cp .env.example .env

# 3. Generate an encryption key and paste it into .env
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# → Edit .env and set ENCRYPTION_KEY=<output from above>

# 4. Start all services
docker compose up

# 5. Open the app
open http://localhost:5173
```

Database migrations run automatically when the backend starts.

### Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React + Vite + Tailwind |
| Backend API | http://localhost:8000 | FastAPI |
| API docs | http://localhost:8000/docs | Swagger UI (auto-generated) |
| Postgres | localhost:5432 | Database |

### Environment variables

All variables are documented in `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `gastownmeals` | Postgres database name |
| `POSTGRES_USER` | `gastownmeals` | Postgres username |
| `POSTGRES_PASSWORD` | `gastownmeals` | Postgres password |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL used by the frontend |
| `ENCRYPTION_KEY` | *(required)* | Fernet key for encrypting stored API keys |

### Service details

**frontend** (`./frontend`) — React 18 + Vite + Tailwind CSS. Vite proxies are configured
via `VITE_API_URL`. The dev server binds to `0.0.0.0` inside the container so it's
reachable at http://localhost:5173.

**backend** (`./backend`) — FastAPI + SQLAlchemy + Alembic. Runs with `--reload` so
changes to Python files restart the server automatically. On startup, Alembic
automatically migrates the database to the latest schema. The database URL is injected
via `DATABASE_URL`.

**db** — Postgres 16. Data persists in a named Docker volume (`postgres_data`). The
backend waits for the DB health check before starting.
