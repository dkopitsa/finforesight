# FinForesight MVP Development Todo

**Project Status:** In Development
**Current Phase:** Stage 1 - Infrastructure Setup
**Last Updated:** 2025-11-09

---

## Stage 1: Infrastructure and Basic Setup ✅ (Partial)

### Backend Infrastructure
- [x] Project structure setup (backend/)
- [x] FastAPI basic application with CORS
- [x] Pydantic settings configuration
- [x] Alembic migrations setup (async)
- [x] Basic database models (User, Account, Category)
- [x] Development tooling (Makefile)
- [x] .env configuration
- [ ] Docker Compose for local PostgreSQL
- [ ] Error handling middleware
- [ ] Logging configuration
- [ ] JWT authentication implementation
- [ ] Password hashing utilities
- [ ] User registration endpoint
- [ ] User login endpoint
- [ ] Token refresh endpoint

### Additional Database Models Needed
- [ ] RefreshToken model
- [ ] ScheduledTransaction model
- [ ] ScheduledTransactionException model
- [ ] AccountReconciliation model
- [ ] ExchangeRate model

### Frontend Infrastructure
- [ ] Create Angular 19 project
- [ ] Install and configure ng-zorro-antd
- [ ] Set up project structure (feature modules)
- [ ] Configure Angular routing
- [ ] Create AuthGuard
- [ ] Create AuthInterceptor
- [ ] Create HTTP error interceptor
- [ ] Login page
- [ ] Registration page
- [ ] Main layout component

### DevOps
- [ ] Docker Compose (PostgreSQL + Backend)
- [ ] docker-compose.yml configuration
- [ ] Dockerfile for backend
- [ ] Environment variables documentation

---

## Stage 2: Accounts and Basic Dashboard (Week 2)

### Backend - Accounts Module
- [ ] Pydantic schemas for Account (Create, Update, Response)
- [ ] GET /api/v1/accounts - List all accounts
- [ ] POST /api/v1/accounts - Create account
- [ ] GET /api/v1/accounts/{id} - Get single account
- [ ] PUT /api/v1/accounts/{id} - Update account
- [ ] DELETE /api/v1/accounts/{id} - Soft delete account
- [ ] Account balance calculation logic
- [ ] Account type validation

### Backend - Categories
- [ ] Seed system categories (income, expense, transfer)
- [ ] GET /api/v1/categories - List categories
- [ ] Category icons and colors configuration

### Backend - Dashboard Summary
- [ ] GET /api/v1/dashboard/summary - Basic summary
- [ ] Calculate liquid assets total
- [ ] Calculate investments total
- [ ] Calculate credit used
- [ ] Calculate net worth

### Backend - Exchange Rates
- [ ] ExchangeRate model and migration
- [ ] Integration with exchangerate-api.com
- [ ] Daily exchange rate update job
- [ ] Currency conversion utility functions
- [ ] GET /api/v1/exchange-rates - Get current rates

### Frontend - Accounts Module
- [ ] Accounts list component
- [ ] Account card component
- [ ] Account form (create/edit)
- [ ] Account type selector
- [ ] Currency selector
- [ ] Delete confirmation modal
- [ ] Accounts routing

### Frontend - Dashboard
- [ ] Dashboard page layout
- [ ] Summary cards component (4 cards)
- [ ] Empty state component
- [ ] Loading spinner component
- [ ] Page header component

---

## Stage 3: Transaction Scheduler (Week 3-4)

### Backend - Scheduled Transactions
- [ ] ScheduledTransaction model migration
- [ ] ScheduledTransactionException model migration
- [ ] Pydantic schemas for transactions
- [ ] POST /api/v1/scheduled-transactions - Create transaction
- [ ] GET /api/v1/scheduled-transactions - List all
- [ ] GET /api/v1/scheduled-transactions/{id} - Get single
- [ ] PUT /api/v1/scheduled-transactions/{id} - Update (with mode)
- [ ] DELETE /api/v1/scheduled-transactions/{id} - Delete (with mode)
- [ ] GET /api/v1/scheduled-transactions/instances - Get expanded instances
- [ ] Recurring transaction expansion logic
- [ ] Exception handling for recurring edits
- [ ] "Split" logic for "this and future" edits

### Frontend - Scheduler Module
- [ ] Scheduler page layout
- [ ] Transaction list component
- [ ] Transaction form component
- [ ] Recurrence configuration component
- [ ] Edit recurring modal (3 options)
- [ ] Transaction type selector (income/expense/transfer)
- [ ] Category selector with icons
- [ ] Date picker integration
- [ ] Recurring pattern selector (monthly/yearly)
- [ ] Calendar view component (optional)

---

## Stage 4: Forecast Calculation (Week 5)

### Backend - Forecast Service
- [ ] ForecastService class
- [ ] Calculate balance from initial + transactions
- [ ] Expand recurring transactions for period
- [ ] Apply exceptions to recurring series
- [ ] Group by account type categories
- [ ] Multi-currency conversion
- [ ] GET /api/v1/forecast - Main forecast endpoint
- [ ] Query params: from_date, to_date, granularity
- [ ] Optimize database queries (N+1 prevention)
- [ ] Cache exchange rates

### Frontend - Forecast Visualization
- [ ] ECharts integration
- [ ] Forecast chart component (stacked area)
- [ ] 4 data series (liquid, investment, credit, loans)
- [ ] Chart interactivity (zoom, tooltip)
- [ ] "Today" vertical line indicator
- [ ] Period filter component
- [ ] Upcoming events list component
- [ ] Event card component

---

## Stage 5: Reconciliation and Analysis (Week 6)

### Backend - Reconciliation
- [ ] AccountReconciliation model migration
- [ ] POST /api/v1/accounts/{id}/reconcile - Create reconciliation
- [ ] GET /api/v1/accounts/{id}/reconciliations - History
- [ ] Create adjustment transaction on reconciliation
- [ ] Recalculate forecast from reconciliation date
- [ ] Bulk reconciliation endpoint
- [ ] Reconciliation by institution grouping

### Backend - Analysis
- [ ] GET /api/v1/analysis - Plan vs Actual
- [ ] Calculate planned totals from scheduled transactions
- [ ] Calculate actual totals from reconciliations
- [ ] Interpolate between reconciliation points
- [ ] Deviation calculation by category
- [ ] Simple recommendations logic

### Frontend - Reconciliation
- [ ] Reconciliation modal component
- [ ] Account balance input
- [ ] Expected vs Actual comparison
- [ ] Note textarea
- [ ] Reconciliation history table
- [ ] Institution grouping UI (accordion)
- [ ] Bulk reconciliation interface
- [ ] Status indicators (synced/needs update)

### Frontend - Analysis Page
- [ ] Analysis page layout
- [ ] Plan vs Actual summary cards
- [ ] Plan vs Actual line chart
- [ ] Category breakdown table
- [ ] Comparison bars visualization
- [ ] Period selector
- [ ] Recommendations card

### Frontend - Dashboard Alerts
- [ ] Alerts block component
- [ ] Reconciliation needed alert
- [ ] Negative forecast alert
- [ ] Long time since reconciliation alert

---

## Stage 6: Settings and Polish (Week 7)

### Backend - User Settings
- [ ] GET /api/v1/settings - Get user settings
- [ ] PUT /api/v1/settings - Update settings
- [ ] PUT /api/v1/settings/password - Change password
- [ ] Current password verification
- [ ] Profile update validation

### Frontend - Settings Module
- [ ] Settings page layout
- [ ] Profile section (name, email)
- [ ] Base currency selector
- [ ] Date format selector
- [ ] Number format settings
- [ ] Password change form
- [ ] Logout button
- [ ] Logout from all devices

### UX Improvements
- [ ] Loading states for all API calls
- [ ] Error messages (user-friendly)
- [ ] Success toast notifications
- [ ] Confirmation dialogs (delete, reset)
- [ ] Form validation feedback
- [ ] Skeleton loaders
- [ ] Empty states with illustrations

### Mobile Responsive
- [ ] Dashboard mobile layout
- [ ] Accounts mobile layout
- [ ] Scheduler mobile layout
- [ ] Forms mobile optimization
- [ ] Navigation drawer for mobile
- [ ] Floating action buttons
- [ ] Touch-friendly controls

---

## Stage 7: Testing and Deployment (Week 8-9)

### Backend Testing
- [ ] Pytest configuration
- [ ] Test fixtures (users, accounts, transactions)
- [ ] Unit tests for ForecastService
- [ ] Unit tests for RecurrenceExpander
- [ ] Unit tests for currency conversion
- [ ] Integration tests for auth endpoints
- [ ] Integration tests for accounts API
- [ ] Integration tests for transactions API
- [ ] Integration tests for forecast API
- [ ] Integration tests for reconciliation API
- [ ] Test coverage > 80%

### Frontend Testing
- [ ] Karma/Jest configuration
- [ ] Unit tests for services
- [ ] Unit tests for components
- [ ] E2E tests (Cypress/Playwright)
- [ ] E2E: User registration and login
- [ ] E2E: Create account flow
- [ ] E2E: Create transaction flow
- [ ] E2E: Reconciliation flow
- [ ] Cross-browser testing

### Deployment
- [ ] Production environment variables
- [ ] Database backup strategy
- [ ] Choose hosting (Railway/Render/Fly.io)
- [ ] Deploy backend
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Configure custom domain
- [ ] SSL certificate setup
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated tests in CI
- [ ] Automated deployment on merge to main

### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide
- [ ] Developer setup guide
- [ ] Architecture documentation
- [ ] Database schema diagram
- [ ] Deployment guide

---

## Future Enhancements (v1.1+)

### Advanced Features
- [ ] Weekly/daily recurring transactions
- [ ] Complex recurrence patterns (iCalendar RRULE)
- [ ] "What if" scenarios
- [ ] Custom categories
- [ ] Tags for transactions
- [ ] Goals and savings tracking
- [ ] Shared accounts (family budgeting)
- [ ] Account parameter history tracking

### Integrations
- [ ] Email verification
- [ ] Password reset via email
- [ ] Bank integrations (Plaid/Tinkoff/Open Banking)
- [ ] CSV import/export
- [ ] PDF reports export
- [ ] Push notifications
- [ ] Email notifications

### Technical Improvements
- [ ] NgRx state management
- [ ] Redis caching
- [ ] Background jobs (Celery)
- [ ] Two-factor authentication
- [ ] Audit logging
- [ ] Advanced rate limiting
- [ ] Data encryption at rest

### Mobile
- [ ] React Native / Flutter app
- [ ] Native push notifications
- [ ] Biometric authentication
- [ ] Home screen widget

### UI/UX
- [ ] Dark theme
- [ ] Internationalization (i18n)
- [ ] Keyboard shortcuts
- [ ] Onboarding tour
- [ ] Interactive tutorials
- [ ] Accessibility improvements (WCAG 2.1 AA)

---

## Notes

### Current Blockers
- PostgreSQL database setup required before running migrations
- Frontend project not started yet

### Technical Decisions Made
- Using uv for Python package management
- Async SQLAlchemy 2.0 for database
- PostgreSQL as primary database
- Angular 19 for frontend
- ng-zorro-antd for UI components
- Apache ECharts for charts

### Next Immediate Steps
1. Set up PostgreSQL database (Docker or local)
2. Run initial database migration
3. Implement JWT authentication
4. Create authentication endpoints
5. Start Angular frontend project
