# FinForesight Backend

FastAPI backend for FinForesight financial planning application.

## Prerequisites

- Python 3.12 or higher
- PostgreSQL 16 (or use SQLite for local development)
- uv (Python package manager)

## Setup

### 1. Create virtual environment:
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install dependencies:
```bash
uv pip install -e ".[dev]"
```

### 3. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and update the following:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SECRET_KEY` - Generate with: `openssl rand -hex 32`
- `BACKEND_CORS_ORIGINS` - Your frontend URL(s)

### 4. Set up PostgreSQL database:

**Option A: Local PostgreSQL**
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE finforesight;
CREATE USER finforesight WITH PASSWORD 'finforesight';
GRANT ALL PRIVILEGES ON DATABASE finforesight TO finforesight;
\q
```

**Option B: Use SQLite (development only)**
Update `DATABASE_URL` in `.env`:
```
DATABASE_URL=sqlite+aiosqlite:///./finforesight.db
```

### 5. Create initial migration (only needed once):
```bash
alembic revision --autogenerate -m "Initial schema: users, accounts, categories"
```

### 6. Run migrations:
```bash
alembic upgrade head
```

## Running

### Using Makefile (Recommended)

Start the development server:
```bash
make dev
```

View all available commands:
```bash
make help
```

### Direct Commands

Alternatively, you can use direct commands:
```bash
uvicorn app.main:app --reload
```

API will be available at http://localhost:8000
- API docs: http://localhost:8000/api/v1/docs
- Health check: http://localhost:8000/api/health

## Makefile Commands

### Development
- `make dev` - Run development server with auto-reload
- `make shell` - Start Python shell with app context
- `make setup` - Complete initial setup

### Database
- `make db-upgrade` - Apply all pending migrations
- `make db-downgrade` - Rollback last migration
- `make db-reset` - Reset database (caution!)
- `make db-current` - Show current database revision
- `make db-history` - Show migration history
- `make migrate MESSAGE="description"` - Create new migration

### Testing
- `make test` - Run tests
- `make test-cov` - Run tests with coverage report
- `make test-watch` - Run tests in watch mode

### Code Quality
- `make format` - Format code with black
- `make lint` - Run linter (ruff)
- `make fix` - Auto-fix formatting and lint issues
- `make quality` - Run all quality checks

### Utilities
- `make clean` - Clean up cache and build artifacts
- `make install` - Install dependencies
- `make help` - Show all available commands

## Manual Commands

If you prefer not to use Make:

**Database Migrations:**
```bash
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                               # Apply migrations
alembic downgrade -1                               # Rollback migration
```

**Testing:**
```bash
pytest                      # Run tests
pytest --cov=app tests/     # With coverage
```

**Code Quality:**
```bash
black .              # Format code
ruff check .         # Lint code
ruff check . --fix   # Auto-fix lint issues
```
