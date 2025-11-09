# FinForesight - Financial Planning Application

## Project Overview

**FinForesight** (Финансовый планировщик) is a web application for medium and long-term financial planning with focus on capital trajectory visualization and forecasting the impact of major financial events.

**Key Differentiator:** Focus on planning through major regular and one-time financial events rather than micromanaging daily transactions. Think "Google Calendar for money" rather than detailed expense tracker.

**Version:** MVP 1.0
**Status:** In development

## Target Audience

- Young professionals (25-40 years) with relatively stable income
- Families planning major purchases (real estate, car)
- Freelancers with irregular income needing cash flow visualization
- People planning financial independence (FIRE movement)

**Common traits:**
- Don't want to spend time tracking every coffee purchase
- Need understanding of financial situation over 1-2 year horizon
- Make decisions about major purchases based on forecasts

## Technology Stack

### Backend
- **Framework:** FastAPI 0.104+
- **Language:** Python 3.12+
- **ORM:** SQLAlchemy 2.0 (async)
- **Migrations:** Alembic
- **Authentication:** JWT (python-jose)
- **Password hashing:** bcrypt (passlib)
- **Validation:** Pydantic v2
- **Package manager:** uv

### Frontend
- **Framework:** Angular 19+
- **UI Library:** ng-zorro-antd (Ant Design)
- **Charts:** Apache ECharts (through ng-zorro)
- **State Management:** RxJS + Angular Services (NgRx postponed to v1.1)
- **HTTP Client:** HttpClient (Angular)

### Database
- **Production:** PostgreSQL 16
- **Development:** SQLite (for local development)

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Deployment:** Railway / Render / Fly.io
- **Environment management:** .env files

## Core Features (MVP)

### 1. Authentication & Security
- Registration by email and password
- JWT access tokens (15 min) + refresh tokens (7 days)
- HTTPOnly cookies for refresh tokens
- CORS configuration
- Rate limiting on auth endpoints

### 2. Dashboard
- **Forecast Chart:** Stacked area chart with 4 areas:
  - Liquid assets (blue) - checking, savings, cash
  - Investments (green) - investment, retirement accounts
  - Credit used (red) - negative credit card balances
  - Loans receivable (orange) - money lent to others
- **Summary Cards:** Current values for each category
- **Net Worth:** Total across all categories
- **Upcoming Events:** Next 10 scheduled transactions
- **Alerts Block:** Warnings about reconciliation needs, negative forecasts

### 3. Accounts Module
- **Account Types:**
  - Liquid: checking, savings, cash
  - Long-term: investment, retirement
  - Credit: credit_card, loan
  - Receivables: loan_given
- **CRUD Operations:** Create, read, update, delete accounts
- **Reconciliation:** Sync forecast with real account balances
  - Manual entry of actual balance
  - System creates adjustment transaction
  - Forecast recalculation from that date

### 4. Scheduler Module
- **Transaction Types:** income, expense, transfer
- **One-time Events:** Single date transactions
- **Recurring Events:**
  - Monthly: specific day (1-31) or last day of month
  - Yearly: specific day and month
  - Start date, optional end date
- **Editing Recurring Transactions:**
  - "This occurrence only" - creates exception
  - "All in series" - updates base transaction
  - "This and future" - ends current, creates new series
- **Categories:** System categories for income, expenses, transfers

### 5. Analysis Module (Simplified for MVP)
- **Plan vs Actual:** Comparison based on reconciliation data
- **Metrics:** Income, expenses, savings (planned vs actual)
- **Chart:** Line chart comparing forecasted vs actual balance
- **Category Breakdown:** Major categories with deviations
- **Recommendations:** Simple suggestions based on deviations

### 6. Settings
- User profile (name, base currency)
- Password change
- Regional settings (date format, number format)
- Logout from all devices

## Database Schema

### Core Tables
- `users` - User accounts and preferences
- `accounts` - Financial accounts (bank, investment, etc.)
- `categories` - Transaction categories (system + custom)
- `scheduled_transactions` - Planned transactions (one-time + recurring)
- `scheduled_transaction_exceptions` - Exceptions to recurring series
- `account_reconciliations` - Balance correction history
- `exchange_rates` - Currency exchange rate cache
- `refresh_tokens` - JWT refresh token management

## Multi-Currency Support

- All amounts stored in original account currency
- Dashboard converts everything to user's base currency
- Historical data uses exchange rate from transaction date
- Forecast uses current exchange rate
- Exchange rate cache updated daily
- Supported currencies: USD, EUR, GBP, JPY, CNY, RUB, AUD, CAD, CHF, SEK, NOK, DKK, PLN, CZK, HUF, TRY, INR, BRL, MXN, ARS

## UX Highlights

### Reconciliation
- Grouped by financial institutions (banks)
- Accordion UI for each institution
- Batch input for multiple accounts
- Status indicators (needs update, partially synced, synced)
- Automatic deviation calculation
- Color-coded feedback (green/red badges)
- Institution-level notes
- Floating save bar

### Calendar View
- Full month calendar with navigation
- Color-coded events (income/expense/transfer)
- Current day highlight
- Monthly summary panel
- Click date to add event
- Click event to edit
- Overflow handling ("N more events...")

### Analysis
- AI-powered recommendations at top
- Summary cards for income/expenses/savings
- Plan vs Actual line chart
- Category breakdown with visual comparison bars
- Color-coded deviations

## Frontend Structure

```
src/app/
├── core/                    # Singleton services
│   ├── services/            # auth, api, storage
│   ├── guards/              # auth guard
│   └── interceptors/        # auth, error
├── shared/                  # Reusable components
│   ├── components/          # page-header, loading-spinner, empty-state
│   └── pipes/               # currency-format, date-format
└── features/
    ├── auth/                # Login, register
    ├── dashboard/           # Main dashboard
    ├── accounts/            # Account management
    ├── scheduler/           # Transaction scheduler
    ├── analysis/            # Plan vs actual analysis
    └── settings/            # User settings
```

## API Structure

Base URL: `/api/v1`

### Main Endpoints
- `/auth/*` - Authentication (register, login, refresh, logout)
- `/dashboard` - Dashboard data (summary, forecast, upcoming events, alerts)
- `/accounts` - CRUD for accounts
- `/accounts/{id}/reconcile` - Balance reconciliation
- `/scheduled-transactions` - CRUD for scheduled transactions
- `/scheduled-transactions/instances` - Get expanded instances for period
- `/forecast` - Forecast calculation
- `/analysis` - Plan vs actual analysis
- `/categories` - Transaction categories
- `/settings` - User settings

## Key Business Logic

### Forecast Calculation
1. Start from most recent reconciliation (or initial balance)
2. Apply all scheduled transactions chronologically
3. Expand recurring transactions for the period
4. Apply exceptions to recurring series
5. Calculate balance for each account type category
6. Convert to base currency using appropriate rates
7. Return time series data for chart

### Recurring Transaction Expansion
1. Fetch all recurring transactions within date range
2. For monthly: generate instances on specified day of month
3. For yearly: generate instances on specified day/month
4. Apply exceptions (modified amounts or deletions)
5. Sort by date

### Reconciliation Process
1. User enters actual balance from bank
2. System calculates expected balance (forecast)
3. Calculate adjustment = actual - expected
4. Create adjustment transaction
5. Create reconciliation record
6. Recalculate forecast from this point forward

## Development Guidelines

### Backend
- Use async/await for all database operations
- Pydantic models for request/response validation
- Proper error handling with appropriate HTTP status codes
- Use SQLAlchemy relationships for efficient queries
- Write unit tests for business logic (ForecastService)
- Use Alembic migrations for schema changes

### Frontend
- Feature modules with lazy loading
- Reactive forms for all inputs
- Proper error handling and loading states
- Responsive design (mobile-first approach)
- Use ng-zorro components consistently
- RxJS for async operations

### Security
- Never expose sensitive data in responses
- Validate all inputs on backend
- Use parameterized queries (SQLAlchemy ORM)
- Implement rate limiting
- HTTPS only in production
- HTTPOnly cookies for refresh tokens

## Responsive Design

### Breakpoints
- xs: 0-575px (mobile)
- sm: 576-767px (large mobile)
- md: 768-991px (tablet)
- lg: 992-1199px (desktop)
- xl: ≥1200px (large desktop)

### Mobile Adaptations
- Dashboard: Full-width chart, stacked cards, compact event list
- Scheduler: List view instead of calendar, FAB for add button
- Tables: Horizontal scroll or card view
- Reconciliation: Card view instead of table

## Performance Targets

- Dashboard load time: < 2 seconds
- Forecast calculation: < 1 second for 36 months
- API response time: median < 200ms, 95th percentile < 500ms

## Success Metrics (MVP)

- Time to first forecast: < 10 minutes
- Weekly active users retention: > 40% after 1 month
- Average session duration: 5-7 minutes
- Feature adoption:
  - Recurring operations: > 80%
  - Reconciliation: > 60%
  - One-time events: > 70%

## Planned for v1.1

- Extended recurrence rules (weekly, daily, complex patterns)
- Account parameter history tracking
- "What if" scenarios
- Detailed historical analysis
- Custom categories and tags
- Goals and savings tracking
- Shared accounts (family budgeting)
- Email verification and password recovery
- Push and email notifications
- Data export/import (CSV, PDF, JSON)
- Bank integration (Open Banking, Plaid, Tinkoff)
- Mobile app (React Native or Flutter)
- Two-factor authentication
- Dark theme
- Internationalization (i18n)

## Color System

- Green (#52c41a) - Income, positive deviations
- Red (#ff4d4f) - Expenses, negative deviations
- Blue (#1890ff) - Transfers, neutral actions
- Gray - Planned values, historical data, inactive elements

## Common User Scenarios

### Scenario 1: Planning Major Purchase
1. Add one-time event "Car Purchase" for $25,000 in Aug 2026
2. See forecast shows negative balance in September
3. Move purchase to November 2026
4. Forecast now shows positive balance maintained
5. Make purchase decision

### Scenario 2: Income Change
1. Open recurring "Salary" transaction
2. Choose "This and future"
3. Update amount from $5,000 to $6,500 starting January
4. Forecast recalculates showing additional $18,000/year
5. Adjust investment contributions accordingly

### Scenario 3: Sync with Reality
1. Check bank app, see balance is $12,680
2. In app, forecast shows $12,450
3. Open reconciliation, enter actual balance
4. System creates adjustment of $230
5. Forecast updates from this point forward

## Notes for AI Assistant

- This is an MVP with focus on core functionality
- Prefer simplicity over feature completeness
- User experience is critical - keep UI intuitive
- Multi-currency support is essential from day 1
- Reconciliation is key to keeping forecasts accurate
- Recurring transactions with proper editing is complex but crucial
- Performance matters - users expect fast forecast calculations
- Mobile responsiveness is required, not optional
- Security best practices must be followed
- Code should be maintainable and well-documented
