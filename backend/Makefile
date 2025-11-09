.PHONY: help install dev test lint format clean migrate migrate-create db-upgrade db-downgrade run

help:  ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Install dependencies
	uv pip install -e ".[dev]"

dev:  ## Run development server with auto-reload
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:  ## Run tests
	pytest

test-cov:  ## Run tests with coverage report
	pytest --cov=app --cov-report=html --cov-report=term

test-watch:  ## Run tests in watch mode
	pytest-watch

lint:  ## Run linter (ruff)
	ruff check .

lint-fix:  ## Run linter and fix issues automatically
	ruff check . --fix

format:  ## Format code with black
	black .

format-check:  ## Check code formatting without making changes
	black . --check

quality:  ## Run all quality checks (format check + lint + type check)
	@echo "Checking code formatting..."
	@black . --check
	@echo "\nRunning linter..."
	@ruff check .
	@echo "\nRunning type checker..."
	@mypy app/
	@echo "\nAll quality checks passed!"

fix:  ## Auto-fix code issues (format + lint fix)
	@echo "Formatting code..."
	@black .
	@echo "\nFixing lint issues..."
	@ruff check . --fix
	@echo "\nCode fixes applied!"

type-check:  ## Run type checking with mypy
	mypy app/

pre-commit-install:  ## Install pre-commit hooks
	pre-commit install
	@echo "Pre-commit hooks installed!"

pre-commit-run:  ## Run pre-commit hooks on all files
	pre-commit run --all-files

pre-commit-update:  ## Update pre-commit hooks to latest versions
	pre-commit autoupdate

migrate-create:  ## Create new migration with autogenerate (usage: make migrate-create MESSAGE="description")
	@if [ -z "$(MESSAGE)" ]; then \
		echo "Error: MESSAGE is required. Usage: make migrate-create MESSAGE=\"your message\""; \
		exit 1; \
	fi
	alembic revision --autogenerate -m "$(MESSAGE)"

migrate:  ## Alias for migrate-create (usage: make migrate MESSAGE="description")
	@$(MAKE) migrate-create MESSAGE="$(MESSAGE)"

db-upgrade:  ## Apply all pending migrations
	alembic upgrade head

db-downgrade:  ## Rollback last migration
	alembic downgrade -1

db-reset:  ## Reset database (downgrade to base, then upgrade to head)
	@echo "WARNING: This will reset the entire database!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		alembic downgrade base; \
		alembic upgrade head; \
		echo "Database reset complete!"; \
	else \
		echo "Database reset cancelled."; \
	fi

db-current:  ## Show current database revision
	alembic current

db-history:  ## Show migration history
	alembic history

clean:  ## Clean up cache and build artifacts
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf build dist htmlcov .coverage

run:  ## Alias for dev
	@$(MAKE) dev

setup:  ## Complete setup (install + copy env + instructions)
	@echo "Installing dependencies..."
	@uv pip install -e ".[dev]"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "\n.env file created from .env.example"; \
		echo "Please edit .env with your configuration"; \
	else \
		echo "\n.env file already exists"; \
	fi
	@echo "\nSetup complete! Next steps:"
	@echo "1. Edit .env file with your database credentials"
	@echo "2. Create database: make db-setup"
	@echo "3. Run migrations: make db-upgrade"
	@echo "4. Start server: make dev"

venv:  ## Create virtual environment
	uv venv
	@echo "\nVirtual environment created!"
	@echo "Activate it with: source .venv/bin/activate"

shell:  ## Start Python shell with app context
	python -c "from app.main import app; from app.core.database import get_db; from app.models import *; import asyncio; print('Available: app, get_db, User, Account, Category'); exec(open('/dev/stdin').read())" -i

# Default target
.DEFAULT_GOAL := help
