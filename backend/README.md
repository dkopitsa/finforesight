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
- `make type-check` - Run type checking (mypy)
- `make fix` - Auto-fix formatting and lint issues
- `make quality` - Run all quality checks (format + lint + type check)

### Pre-commit Hooks
- `make pre-commit-install` - Install git pre-commit hooks
- `make pre-commit-run` - Run pre-commit on all files
- `make pre-commit-update` - Update hook versions

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
mypy app/            # Type checking
```

## Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality before commits.

**Install hooks (one-time setup):**
```bash
make pre-commit-install
```

**What gets checked automatically on commit:**
- Trailing whitespace removal
- End of file fixes
- YAML/JSON/TOML validation
- Code formatting (Black)
- Linting and auto-fixes (Ruff)
- Type checking (mypy) - app directory only

**Run hooks manually:**
```bash
make pre-commit-run     # Run on all files
pre-commit run          # Run on staged files only
```

**Skip hooks (not recommended):**
```bash
git commit --no-verify
```

## Error Handling

The application includes comprehensive error handling with standardized JSON responses.

**Features:**
- Custom exception classes for different HTTP status codes
- Automatic validation error formatting
- Database error handling (integrity constraints, etc.)
- Structured error logging
- Consistent error response format

**Test error handlers (DEBUG mode only):**
```bash
# Start server with DEBUG=True
curl http://localhost:8000/api/v1/test/errors/404
curl http://localhost:8000/api/v1/test/errors/400
curl http://localhost:8000/api/v1/test/errors/500
```

**Documentation:** See [app/core/ERROR_HANDLING.md](app/core/ERROR_HANDLING.md) for detailed information.

## Logging

The application features structured logging with different formatters for development and production.

**Features:**
- Colored console output in development
- Structured JSON logs in production
- Rotating file handlers (10MB max, 5 backups)
- Two log files: `logs/app.log` (all logs) and `logs/error.log` (errors only)
- Automatic log level based on DEBUG setting
- Silences noisy third-party loggers

**Log Locations:**
```
logs/
├── app.log    # All application logs (INFO and above)
└── error.log  # Error logs only (ERROR and above)
```

**Using the logger in your code:**
```python
from app.core.logging import get_logger

logger = get_logger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical message")
```

**Production JSON format:**
```json
{
  "timestamp": "2025-11-09T19:24:37.725000+00:00",
  "level": "INFO",
  "logger": "app.main",
  "message": "Starting FinForesight API v0.1.0",
  "module": "main",
  "function": "lifespan",
  "line": 30
}
```
