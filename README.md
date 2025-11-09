# FinForesight

**Financial Planning Application** - Web application for medium and long-term financial planning with focus on capital trajectory visualization and forecasting the impact of major financial events.

> Think "Google Calendar for money" rather than detailed expense tracker.

**Status:** 🚧 In Development (MVP Stage 1)

---

## Project Structure

This is a monorepo containing both backend and frontend:

```
finforesight/
├── backend/          # FastAPI backend (Python)
├── frontend/         # Angular frontend (TypeScript) - Coming soon
├── docs/             # Project documentation
├── TODO.md           # Development task list
├── PROGRESS.md       # Current progress tracker
└── claude.md         # AI assistant context
```

## Quick Start

### Backend

```bash
cd backend
make setup          # Install dependencies and configure
make db-upgrade     # Run database migrations
make dev            # Start development server
```

Visit http://localhost:8000/api/v1/docs for API documentation.

See [backend/README.md](backend/README.md) for detailed setup instructions.

### Frontend

```bash
cd frontend
npm install
npm start
```

Visit http://localhost:4200

*(Frontend setup coming soon)*

## Technology Stack

**Backend:**
- FastAPI + Python 3.12
- PostgreSQL 16
- SQLAlchemy 2.0 (async)
- Alembic migrations
- JWT authentication

**Frontend:**
- Angular 19
- ng-zorro-antd (Ant Design)
- Apache ECharts
- RxJS

## Documentation

- [Requirements](financial_planner_requirements.md) - Full product requirements
- [TODO List](TODO.md) - Detailed task breakdown
- [Progress Tracker](PROGRESS.md) - Development status
- [Claude Context](claude.md) - AI assistant context
- [Backend README](backend/README.md) - Backend setup guide
- [UX Designs](ux%20screens.md) - UI/UX specifications

## Development Workflow

1. **Check current status:** See [PROGRESS.md](PROGRESS.md)
2. **Pick a task:** See [TODO.md](TODO.md)
3. **Backend work:** `cd backend && make dev`
4. **Frontend work:** `cd frontend && npm start`
5. **Run tests:** `make test` (in respective directories)
6. **Code quality:** `make quality` (in backend)

## Features (MVP)

- ✅ User authentication & authorization
- ✅ Multi-account management (8 account types)
- ✅ Multi-currency support (20+ currencies)
- ✅ Recurring transactions (monthly, yearly)
- ✅ Financial forecast visualization
- ✅ Balance reconciliation
- ✅ Plan vs Actual analysis
- ✅ Responsive design (mobile-friendly)

## Current Progress

**Stage 1:** Infrastructure Setup - 40% complete
- ✅ Backend API structure
- ✅ Database models
- ✅ Migration system
- ⏳ Authentication
- ⏳ Frontend initialization

See [PROGRESS.md](PROGRESS.md) for detailed status.

## Contributing

This is a personal project, but contributions are welcome!

1. Pick a task from [TODO.md](TODO.md)
2. Create a feature branch
3. Make your changes
4. Run tests and quality checks
5. Submit a pull request

## License

*To be determined*

## Contact

*Add contact information if needed*

---

**Built with ❤️ for better financial planning**
