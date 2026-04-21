# Gas Town Meals

A macro-aware meal planner for fitness-focused singles.

## Development

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2

### Start the dev stack

```bash
docker compose up
```

This starts three services and hot-reloads on file changes:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React + Vite + Tailwind |
| Backend API | http://localhost:8000 | FastAPI |
| API docs | http://localhost:8000/docs | Swagger UI (auto-generated) |
| Postgres | localhost:5432 | Database |

### Environment variables

Copy `.env.example` to `.env` before starting:

```bash
cp .env.example .env
docker compose up
```

Values in `.env.example` work out of the box for local development.

### Service details

**frontend** (`./frontend`) — React 18 + Vite + Tailwind CSS. Vite proxies are configured
via `VITE_API_URL`. The dev server binds to `0.0.0.0` inside the container so it's
reachable at http://localhost:5173.

**backend** (`./backend`) — FastAPI + SQLAlchemy + Alembic. Runs with `--reload` so
changes to Python files restart the server automatically. The database URL is injected
via `DATABASE_URL`.

**db** — Postgres 16. Data persists in a named Docker volume (`postgres_data`). The
backend waits for the DB health check before starting.
