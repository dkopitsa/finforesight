# FinForesight - Manual Test Suite (Success Path)

**Version:** 1.0
**Date:** 2025-11-15
**Type:** Manual Testing - Positive Scenarios
**Author:** QA Team

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [Test Environment](#2-test-environment)
3. [Test Data Requirements](#3-test-data-requirements)
4. [Module 1: Authentication](#module-1-authentication)
5. [Module 2: Dashboard](#module-2-dashboard)
6. [Module 3: Accounts Management](#module-3-accounts-management)
7. [Module 4: Categories](#module-4-categories)
8. [Module 5: Transaction Scheduler](#module-5-transaction-scheduler)
9. [Module 6: Forecast](#module-6-forecast)
10. [Module 7: Reconciliation](#module-7-reconciliation)
11. [Module 8: Settings](#module-8-settings)
12. [End-to-End Scenarios](#end-to-end-scenarios)

---

## 1. Introduction

### 1.1 Purpose
This test suite covers **success path** (happy path) scenarios for manual testing of FinForesight application. All test cases assume valid inputs and expected user behavior without error conditions.

### 1.2 Scope
- ✅ User registration and authentication
- ✅ Account management (CRUD operations)
- ✅ Transaction scheduling (one-time and recurring)
- ✅ Balance forecasting
- ✅ Account reconciliation
- ✅ Dashboard visualization
- ✅ User settings

### 1.3 Out of Scope for This Document
- ❌ Negative testing (invalid inputs, errors)
- ❌ Performance testing
- ❌ Security testing
- ❌ API testing
- ❌ Cross-browser compatibility (will be covered separately)

---

## 2. Test Environment

### 2.1 Prerequisites
- **Frontend URL:** http://localhost:4200
- **Backend API:** http://localhost:8000
- **Database:** PostgreSQL running with clean state
- **Browser:** Chrome/Firefox latest version
- **Screen Resolution:** 1920x1080 (desktop testing)

### 2.2 Backend Setup
```bash
cd backend
make db-upgrade  # Apply migrations
make run         # Start API server
```

### 2.3 Frontend Setup
```bash
cd frontend
npm start        # Start dev server
```

### 2.4 Database State
- Fresh database with system categories seeded
- No user accounts pre-created (unless specified in test)

---

## 3. Test Data Requirements

### 3.1 Test User Credentials
| Email | Password | Purpose |
|-------|----------|---------|
| testuser1@example.com | Test123! | Primary test user |
| testuser2@example.com | Test123! | Secondary user for isolation testing |

### 3.2 Sample Account Data
| Account Name | Type | Currency | Initial Balance | Credit Limit |
|--------------|------|----------|-----------------|--------------|
| Main Checking | checking | USD | 5000.00 | - |
| Savings Account | savings | USD | 15000.00 | - |
| Investment Portfolio | investment | USD | 50000.00 | - |
| Credit Card Visa | credit_card | USD | 0.00 | 5000.00 |

### 3.3 Sample Transaction Data
| Name | Type | Amount | Category | Account | Recurrence |
|------|------|--------|----------|---------|------------|
| Monthly Salary | income | 5000.00 | Salary | Main Checking | Monthly, day 25 |
| Rent Payment | expense | 1500.00 | Rent/Mortgage | Main Checking | Monthly, day 1 |
| Grocery Budget | expense | 500.00 | Groceries | Main Checking | Monthly, day 5 |
| Investment Transfer | transfer | 1000.00 | To Investments | Main Checking → Investment | Monthly, day 28 |

---

## Module 1: Authentication

### TC-AUTH-001: User Registration - Success
**Priority:** P0 (Critical)
**Preconditions:** None

**Steps:**
1. Navigate to http://localhost:4200
2. Click "Register" link/button
3. Fill in registration form:
   - Email: `testuser1@example.com`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
   - Base Currency: Select `USD`
4. Click "Register" button

**Expected Result:**
- ✅ Success message displayed: "Registration successful" or similar
- ✅ User is automatically logged in
- ✅ Redirected to Dashboard page
- ✅ Navigation bar shows user email or profile indicator
- ✅ No error messages displayed

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_
**Notes:** _[Any observations]_

---

### TC-AUTH-002: User Login - Success
**Priority:** P0 (Critical)
**Preconditions:** User account exists (testuser1@example.com / Test123!)

**Steps:**
1. Navigate to http://localhost:4200
2. If logged in, logout first
3. Navigate to login page
4. Fill in login form:
   - Email: `testuser1@example.com`
   - Password: `Test123!`
5. Click "Login" button

**Expected Result:**
- ✅ Success message displayed (optional)
- ✅ Redirected to Dashboard page (/)
- ✅ Navigation bar shows user email
- ✅ Dashboard displays user's data or empty state
- ✅ JWT tokens stored in browser (check localStorage/cookies)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-AUTH-003: Auto-Login on App Start
**Priority:** P1 (High)
**Preconditions:** User previously logged in with "Remember me" (if applicable)

**Steps:**
1. Login as testuser1@example.com
2. Close browser tab
3. Reopen http://localhost:4200

**Expected Result:**
- ✅ User remains logged in
- ✅ Dashboard loads immediately without login prompt
- ✅ User data is displayed correctly

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-AUTH-004: User Logout - Success
**Priority:** P1 (High)
**Preconditions:** User is logged in

**Steps:**
1. Login as testuser1@example.com
2. Click user profile/menu icon
3. Click "Logout" option

**Expected Result:**
- ✅ Success message: "Logged out successfully"
- ✅ Redirected to login page
- ✅ JWT tokens removed from storage
- ✅ Attempting to navigate to protected routes redirects to login
- ✅ Backend refresh token invalidated

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-AUTH-005: Token Refresh - Automatic
**Priority:** P2 (Medium)
**Preconditions:** User logged in with access token near expiry

**Steps:**
1. Login as testuser1@example.com
2. Wait for access token to expire (15 minutes or manipulate token expiry)
3. Perform any API operation (e.g., navigate to Accounts page)

**Expected Result:**
- ✅ Access token is automatically refreshed using refresh token
- ✅ User remains logged in
- ✅ No interruption in user experience
- ✅ API request completes successfully

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## Module 2: Dashboard

### TC-DASH-001: View Dashboard - Empty State
**Priority:** P1 (High)
**Preconditions:** New user logged in with no accounts or transactions

**Steps:**
1. Login as new user (testuser2@example.com)
2. Navigate to Dashboard (should be default landing page)

**Expected Result:**
- ✅ Dashboard page loads successfully
- ✅ Empty state message displayed: "Get started by creating your first account" or similar
- ✅ Call-to-action button: "Add Account" or "Get Started"
- ✅ No errors in console
- ✅ Navigation menu is visible

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-DASH-002: View Dashboard - With Data
**Priority:** P0 (Critical)
**Preconditions:**
- User logged in
- At least 2 accounts created (checking: $5000, savings: $15000)
- At least 2 scheduled transactions created

**Steps:**
1. Login as testuser1@example.com
2. Ensure test data is present (accounts + transactions)
3. Navigate to Dashboard

**Expected Result:**
- ✅ **Summary Cards displayed:**
  - 💰 Liquid Assets: $20,000 (5000 + 15000)
  - 📈 Investments: $0 (if no investment account)
  - 💳 Credit: 0 / 5000 (if credit card added)
  - Net Worth: $20,000

- ✅ **Forecast Chart visible:**
  - X-axis: dates from -6 months to +24 months
  - Y-axis: balance values
  - Stacked areas for liquid/investment/credit
  - Vertical line marking "Today"
  - Interactive tooltip on hover

- ✅ **Upcoming Events list:**
  - Next 5-10 scheduled transactions
  - Columns: Date, Name, Amount, Category
  - Sorted by date (earliest first)
  - Color coding: green for income, red for expenses

- ✅ **Alerts block (if applicable):**
  - Reconciliation reminders
  - Upcoming negative balance warnings

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-DASH-003: Forecast Chart - Interactivity
**Priority:** P1 (High)
**Preconditions:** Dashboard with forecast data loaded

**Steps:**
1. Navigate to Dashboard with data
2. **Hover** over different points on forecast chart
3. **Zoom in/out** using mouse wheel or pinch gesture
4. **Pan** the chart by dragging

**Expected Result:**
- ✅ **Tooltip displays on hover:**
  - Date
  - Liquid Assets value
  - Investments value
  - Credit Used value
  - Total values

- ✅ **Zoom functionality works:**
  - Chart zooms in/out smoothly
  - Axis labels update accordingly

- ✅ **Pan functionality works:**
  - Chart moves left/right
  - Data loads dynamically if needed

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-DASH-004: Navigate to Account from Dashboard
**Priority:** P2 (Medium)
**Preconditions:** Dashboard loaded with accounts

**Steps:**
1. View Dashboard
2. Click on an account name/card in summary section (if clickable)

**Expected Result:**
- ✅ Navigates to Account detail page
- ✅ Account details displayed correctly
- ✅ Back button returns to Dashboard

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## Module 3: Accounts Management

### TC-ACC-001: View Accounts List - Empty State
**Priority:** P2 (Medium)
**Preconditions:** New user with no accounts

**Steps:**
1. Login as new user
2. Navigate to "Accounts" page via sidebar menu

**Expected Result:**
- ✅ Page title: "Accounts" or "My Accounts"
- ✅ Empty state message: "No accounts yet. Create your first account."
- ✅ "Add Account" button visible and prominent
- ✅ No error messages

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-ACC-002: Create Account - Checking Account
**Priority:** P0 (Critical)
**Preconditions:** User logged in

**Steps:**
1. Navigate to Accounts page
2. Click "Add Account" or "+ New Account" button
3. Fill in account form:
   - Name: `Main Checking`
   - Type: Select `Checking Account`
   - Currency: Select `USD`
   - Initial Balance: `5000.00`
   - Initial Balance Date: `2025-11-01` (or today's date)
4. Click "Save" or "Create" button

**Expected Result:**
- ✅ Success message: "Account created successfully"
- ✅ Account appears in accounts list
- ✅ Account card/row shows:
  - Name: "Main Checking"
  - Type: "Checking Account" or icon
  - Balance: $5,000.00
  - Currency: USD
- ✅ Account is active (not deleted)
- ✅ Form closes/redirects to accounts list

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-ACC-003: Create Account - Credit Card with Limit
**Priority:** P1 (High)
**Preconditions:** User logged in

**Steps:**
1. Navigate to Accounts page
2. Click "Add Account"
3. Fill in form:
   - Name: `Credit Card Visa`
   - Type: Select `Credit Card`
   - Currency: `USD`
   - Initial Balance: `0.00`
   - **Credit Limit:** `5000.00` (field should appear for credit card type)
   - Initial Balance Date: today
4. Click "Save"

**Expected Result:**
- ✅ Success message displayed
- ✅ Credit limit field was visible and editable
- ✅ Account shows in list with:
  - Balance: $0.00
  - Credit Available: $5,000.00 / $5,000.00 (or similar display)
  - Type: Credit Card

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-ACC-004: Create Multiple Account Types
**Priority:** P1 (High)
**Preconditions:** User logged in

**Steps:**
1. Create the following accounts one by one:

   **Account 1:**
   - Name: `Savings Account`
   - Type: `Savings`
   - Currency: `USD`
   - Initial Balance: `15000.00`

   **Account 2:**
   - Name: `Investment Portfolio`
   - Type: `Investment Account`
   - Currency: `USD`
   - Initial Balance: `50000.00`

   **Account 3:**
   - Name: `Cash Wallet`
   - Type: `Cash`
   - Currency: `USD`
   - Initial Balance: `500.00`

2. View accounts list

**Expected Result:**
- ✅ All 4 accounts created successfully
- ✅ Accounts grouped by type:
  - **Liquid Assets:** Main Checking, Savings Account, Cash Wallet
  - **Investments:** Investment Portfolio
  - **Credit:** Credit Card Visa (if created earlier)
- ✅ Total balances calculated correctly:
  - Liquid Assets: $20,500 (5000 + 15000 + 500)
  - Investments: $50,000
  - Net Worth: $70,500

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-ACC-005: View Account Details
**Priority:** P1 (High)
**Preconditions:** At least one account exists

**Steps:**
1. Navigate to Accounts page
2. Click on "Main Checking" account card/name

**Expected Result:**
- ✅ Account detail page opens
- ✅ Displays:
  - Account name: "Main Checking"
  - Account type: "Checking Account"
  - Currency: USD
  - Current balance: $5,000.00
  - Initial balance: $5,000.00
  - Initial balance date: 2025-11-01
  - Created date
- ✅ Action buttons visible: "Edit", "Delete", "Reconcile"
- ✅ Transaction history (if any)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-ACC-006: Edit Account - Name and Credit Limit
**Priority:** P1 (High)
**Preconditions:** Credit Card account exists

**Steps:**
1. Navigate to Accounts page
2. Click "Edit" on "Credit Card Visa" account
3. Update:
   - Name: `Primary Visa Card`
   - Credit Limit: `7500.00` (increased from 5000)
4. Click "Save"

**Expected Result:**
- ✅ Success message: "Account updated successfully"
- ✅ Account name updated to "Primary Visa Card"
- ✅ Credit limit updated to $7,500
- ✅ Credit available shows: $7,500 / $7,500
- ✅ **Cannot edit:** Type, Currency, Initial Balance (fields disabled)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-ACC-007: Delete Account - No Associated Transactions
**Priority:** P1 (High)
**Preconditions:**
- Account "Cash Wallet" exists
- No scheduled transactions linked to this account

**Steps:**
1. Navigate to Accounts page
2. Click "Delete" on "Cash Wallet" account
3. Confirmation dialog appears: "Are you sure?"
4. Click "Confirm" or "Yes"

**Expected Result:**
- ✅ Confirmation dialog displayed before deletion
- ✅ Success message: "Account deleted successfully"
- ✅ Account removed from accounts list
- ✅ Account is soft-deleted (marked as deleted in DB, not physically removed)
- ✅ Dashboard summary updates (balance decreases by $500)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-ACC-008: View Financial Summary
**Priority:** P1 (High)
**Preconditions:** Multiple accounts of different types created

**Steps:**
1. Navigate to Accounts page
2. View summary section (usually at top of page)

**Expected Result:**
- ✅ Summary card/section displays:
  - **Total Liquid Assets:** Sum of checking + savings + cash
  - **Total Investments:** Sum of investment + retirement accounts
  - **Total Credit Used:** Sum of negative balances on credit cards
  - **Total Credit Available:** Sum of unused credit limits
  - **Net Worth:** Liquid + Investments - Credit Used
- ✅ All calculations are accurate
- ✅ Values formatted with currency symbol ($)
- ✅ Values formatted with thousand separators (e.g., $50,000.00)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## Module 4: Categories

### TC-CAT-001: View System Categories
**Priority:** P2 (Medium)
**Preconditions:** User logged in, system categories seeded in DB

**Steps:**
1. Navigate to Categories page (or open category selector in transaction form)
2. View list of categories

**Expected Result:**
- ✅ **Income Categories (6):**
  - Salary
  - Freelance
  - Investment Income
  - Business Income
  - Gift
  - Other Income

- ✅ **Expense Categories (13):**
  - Groceries
  - Utilities
  - Transport
  - Entertainment
  - Healthcare
  - Rent/Mortgage
  - Dining Out
  - Shopping
  - Education
  - Insurance
  - Personal Care
  - Subscriptions
  - Other Expenses

- ✅ **Transfer Category (1):**
  - Transfer between accounts

- ✅ Each category has icon and color
- ✅ System categories are marked (non-deletable)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-CAT-002: Create Custom Category
**Priority:** P2 (Medium)
**Preconditions:** User logged in

**Steps:**
1. Navigate to Categories page
2. Click "Add Category" button
3. Fill in form:
   - Name: `Pet Expenses`
   - Type: Select `Expense`
   - Icon: Select any icon (e.g., "pet")
   - Color: Select color (e.g., #FF6B6B)
4. Click "Save"

**Expected Result:**
- ✅ Success message: "Category created successfully"
- ✅ New category appears in categories list
- ✅ Category shows:
  - Name: "Pet Expenses"
  - Type: Expense
  - Icon: selected icon
  - Color: selected color
- ✅ Category is available in transaction form dropdowns
- ✅ Marked as custom (can be edited/deleted)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-CAT-003: Edit Custom Category
**Priority:** P2 (Medium)
**Preconditions:** Custom category "Pet Expenses" exists

**Steps:**
1. Navigate to Categories page
2. Click "Edit" on "Pet Expenses" category
3. Update:
   - Name: `Pet Care`
   - Color: Change to different color
4. Click "Save"

**Expected Result:**
- ✅ Success message displayed
- ✅ Category name updated to "Pet Care"
- ✅ Color updated
- ✅ Changes reflected everywhere category is used

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-CAT-004: Delete Custom Category - No Usage
**Priority:** P2 (Medium)
**Preconditions:**
- Custom category exists
- No transactions using this category

**Steps:**
1. Navigate to Categories page
2. Click "Delete" on custom category
3. Confirm deletion

**Expected Result:**
- ✅ Confirmation dialog shown
- ✅ Success message: "Category deleted successfully"
- ✅ Category removed from list
- ✅ Category no longer available in transaction forms

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## Module 5: Transaction Scheduler

### TC-TRX-001: View Scheduler - Empty State
**Priority:** P2 (Medium)
**Preconditions:** User logged in, no scheduled transactions

**Steps:**
1. Navigate to "Scheduler" or "Transactions" page

**Expected Result:**
- ✅ Page title: "Transaction Scheduler" or similar
- ✅ Empty state message: "No scheduled transactions yet"
- ✅ "Add Transaction" button visible
- ✅ Tab/toggle for view modes: List | Calendar
- ✅ Filter options visible but empty

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-002: Create One-Time Income Transaction
**Priority:** P0 (Critical)
**Preconditions:**
- User logged in
- At least one account exists ("Main Checking")

**Steps:**
1. Navigate to Scheduler page
2. Click "Add Transaction" button
3. Fill in form:
   - Name: `Year-End Bonus`
   - Type: Select `Income`
   - Amount: `3000.00`
   - Account: Select `Main Checking`
   - Category: Select `Salary` (or other income category)
   - **Recurrence:** Select `One-time`
   - Date: `2025-12-15`
   - Note: `Annual performance bonus` (optional)
4. Click "Save"

**Expected Result:**
- ✅ Success message: "Transaction created successfully"
- ✅ Transaction appears in list view
- ✅ Transaction shows:
  - Name: "Year-End Bonus"
  - Type: Income (green icon/color)
  - Amount: $3,000.00
  - Date: Dec 15, 2025
  - Account: Main Checking
  - Category: Salary
- ✅ Transaction appears in calendar view on Dec 15
- ✅ Form resets or closes

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-003: Create Recurring Monthly Expense
**Priority:** P0 (Critical)
**Preconditions:** Account exists

**Steps:**
1. Click "Add Transaction"
2. Fill in form:
   - Name: `Rent Payment`
   - Type: `Expense`
   - Amount: `1500.00`
   - Account: `Main Checking`
   - Category: `Rent/Mortgage`
   - **Recurrence:** Select `Recurring`
   - **Frequency:** Select `Monthly`
   - **Day of Month:** `1` (1st of every month)
   - **Start Date:** `2025-11-01`
   - **End Date:** Leave empty (indefinite) or select future date
   - Note: `Monthly rent to landlord`
3. Click "Save"

**Expected Result:**
- ✅ Success message displayed
- ✅ Transaction appears in recurring transactions list
- ✅ Shows:
  - Name: "Rent Payment"
  - Amount: $1,500.00
  - Frequency: "Monthly on 1st"
  - Account: Main Checking
  - Category: Rent/Mortgage
  - Start: Nov 1, 2025
  - End: "Ongoing" (if no end date)
- ✅ **In Calendar view:** multiple instances visible (Dec 1, Jan 1, Feb 1, etc.)
- ✅ Each instance is clickable/editable

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-004: Create Recurring Monthly Income
**Priority:** P0 (Critical)
**Preconditions:** Account exists

**Steps:**
1. Add new transaction:
   - Name: `Monthly Salary`
   - Type: `Income`
   - Amount: `5000.00`
   - Account: `Main Checking`
   - Category: `Salary`
   - Recurrence: `Recurring`
   - Frequency: `Monthly`
   - Day of Month: `25` (25th of every month)
   - Start Date: `2025-01-25`
   - End Date: empty (indefinite)
2. Save

**Expected Result:**
- ✅ Transaction created successfully
- ✅ Shows frequency: "Monthly on 25th"
- ✅ Calendar shows instances on 25th of each month
- ✅ Forecast chart updates with monthly income spikes

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-005: Create Recurring Yearly Transaction
**Priority:** P1 (High)
**Preconditions:** Account exists

**Steps:**
1. Add new transaction:
   - Name: `Car Insurance`
   - Type: `Expense`
   - Amount: `1200.00`
   - Account: `Main Checking`
   - Category: `Insurance`
   - Recurrence: `Recurring`
   - Frequency: `Yearly`
   - **Month:** `March`
   - **Day:** `15`
   - Start Date: `2025-03-15`
   - End Date: empty
2. Save

**Expected Result:**
- ✅ Transaction created
- ✅ Shows: "Yearly on March 15"
- ✅ Calendar shows: Mar 15, 2025; Mar 15, 2026; Mar 15, 2027, etc.
- ✅ Forecast includes yearly expense spikes

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-006: Create Transfer Between Accounts
**Priority:** P1 (High)
**Preconditions:**
- Two accounts exist: "Main Checking" and "Savings Account"

**Steps:**
1. Add new transaction:
   - Name: `Monthly Savings Transfer`
   - Type: `Transfer`
   - Amount: `1000.00`
   - **From Account:** `Main Checking`
   - **To Account:** `Savings Account`
   - Category: `Transfer between accounts`
   - Recurrence: `Recurring`
   - Frequency: `Monthly`
   - Day: `28`
   - Start Date: `2025-11-28`
2. Save

**Expected Result:**
- ✅ Transaction created
- ✅ Shows:
  - Type: Transfer
  - Amount: $1,000.00
  - From: Main Checking → To: Savings Account
  - Frequency: Monthly on 28th
- ✅ **Forecast impact:**
  - Main Checking decreases by $1000 monthly
  - Savings Account increases by $1000 monthly
- ✅ Net worth remains unchanged (internal transfer)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-007: View Transactions - List View
**Priority:** P1 (High)
**Preconditions:** Multiple transactions created (mix of one-time and recurring)

**Steps:**
1. Navigate to Scheduler page
2. Select "List View" mode

**Expected Result:**
- ✅ **Grouped by type:**
  - Income section
  - Expense section
  - Transfer section
- ✅ Each transaction shows:
  - Name
  - Amount (with color: green for income, red for expense, blue for transfer)
  - Frequency (one-time date or recurrence pattern)
  - Account(s)
  - Category
  - Actions: Edit, Delete buttons
- ✅ Sorted logically (e.g., by amount or alphabetically)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-008: View Transactions - Calendar View
**Priority:** P1 (High)
**Preconditions:** Recurring transactions exist

**Steps:**
1. Navigate to Scheduler page
2. Select "Calendar View" mode
3. View current month
4. Navigate to next month
5. Navigate to previous month

**Expected Result:**
- ✅ Calendar grid displayed (month view)
- ✅ Each day shows scheduled transaction instances
- ✅ Transaction instances color-coded by type
- ✅ Click on instance shows details in tooltip/popup
- ✅ Navigation controls work:
  - "Next Month" button moves forward
  - "Previous Month" button moves backward
  - "Today" button returns to current month
- ✅ Recurring transactions appear on correct dates

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-009: Edit Recurring Transaction - All Occurrences
**Priority:** P0 (Critical)
**Preconditions:** Recurring transaction "Monthly Salary" exists

**Steps:**
1. In Scheduler list, click "Edit" on "Monthly Salary"
2. Modal appears: "This is a recurring transaction. What would you like to edit?"
3. Select: **"All occurrences"**
4. Click "Continue"
5. Update form:
   - Amount: `5500.00` (increased from 5000)
6. Save

**Expected Result:**
- ✅ Edit mode selection modal displayed
- ✅ Form opens with current values pre-filled
- ✅ After save:
  - Success message: "All occurrences updated"
  - Amount updated to $5,500 for ALL instances (past and future)
  - Forecast chart recalculates
  - Calendar view shows updated amounts

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-010: Edit Recurring Transaction - This Occurrence Only
**Priority:** P0 (Critical)
**Preconditions:** Recurring transaction "Monthly Salary" exists

**Steps:**
1. Navigate to Calendar view
2. Click on "Monthly Salary" instance for December 2025
3. Click "Edit"
4. Modal: Select **"This occurrence only"**
5. Click "Continue"
6. Update:
   - Amount: `7000.00` (bonus month)
   - Note: `Includes holiday bonus`
7. Save

**Expected Result:**
- ✅ Exception created for December 2025 instance
- ✅ December instance shows: $7,000.00
- ✅ Other instances (Nov, Jan, Feb, etc.) remain: $5,500.00
- ✅ Exception is marked visually (e.g., icon or color)
- ✅ Forecast reflects the one-time increase in December

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-011: Edit Recurring Transaction - This and Future
**Priority:** P0 (Critical)
**Preconditions:**
- Recurring "Monthly Salary" exists since Jan 2025
- Currently viewing July 2025 instance

**Steps:**
1. Edit "Monthly Salary" instance for July 2025
2. Modal: Select **"This and future occurrences"**
3. Continue
4. Update:
   - Amount: `6000.00` (promotion)
5. Save

**Expected Result:**
- ✅ Original recurring transaction ends on Jun 30, 2025
- ✅ New recurring transaction created starting Jul 1, 2025 with amount $6,000
- ✅ Past instances (Jan-Jun) remain $5,500
- ✅ Future instances (Jul onwards) show $6,000
- ✅ Forecast chart shows stepped increase starting July
- ✅ Both transactions visible in recurring list (if showing archived)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-012: Delete Recurring Transaction - All Occurrences
**Priority:** P1 (High)
**Preconditions:** Recurring transaction exists

**Steps:**
1. Click "Delete" on "Rent Payment" recurring transaction
2. Modal: "Delete this recurring transaction?"
3. Select: **"All occurrences"**
4. Confirm deletion

**Expected Result:**
- ✅ Confirmation dialog shown
- ✅ Success message: "Transaction deleted"
- ✅ Transaction removed from recurring list
- ✅ All calendar instances removed
- ✅ Forecast updates (no more monthly rent expenses)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-013: Delete Recurring Transaction - This Occurrence Only
**Priority:** P1 (High)
**Preconditions:** Recurring transaction exists

**Steps:**
1. In Calendar view, click "Monthly Salary" for August 2025
2. Click "Delete"
3. Modal: Select **"This occurrence only"**
4. Confirm

**Expected Result:**
- ✅ Exception created with `is_deleted = true`
- ✅ August instance removed from calendar
- ✅ Other instances (Jul, Sep, Oct, etc.) remain visible
- ✅ Forecast skips August (no salary that month)
- ✅ Gap visible in calendar

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-014: View Transaction Statistics
**Priority:** P2 (Medium)
**Preconditions:** Multiple transactions exist

**Steps:**
1. Navigate to Scheduler page
2. View Statistics section (if available as separate tab/panel)

**Expected Result:**
- ✅ **Summary stats displayed:**
  - Total monthly income (recurring)
  - Total monthly expenses (recurring)
  - Net monthly savings
  - Number of active recurring transactions
- ✅ **Breakdown by category:**
  - Pie chart or bar chart
  - Shows distribution of expenses by category
  - Shows distribution of income by category
- ✅ **Breakdown by account:**
  - Which accounts have most transactions
- ✅ Charts are interactive (hover tooltips)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-015: Filter Transactions
**Priority:** P2 (Medium)
**Preconditions:** Multiple transactions exist

**Steps:**
1. Navigate to Scheduler page
2. Use filter controls:
   - **By Type:** Select "Income only"
   - **By Category:** Select "Salary"
   - **By Account:** Select "Main Checking"
   - **By Date Range:** Select "Next 3 months"
3. Apply filters

**Expected Result:**
- ✅ Filter controls are intuitive (dropdowns, checkboxes, date pickers)
- ✅ Filtered results show only:
  - Income transactions
  - In "Salary" category
  - On "Main Checking" account
  - Within next 3 months
- ✅ Result count displayed: "Showing X of Y transactions"
- ✅ "Clear Filters" button visible
- ✅ Calendar view also reflects filters

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-TRX-016: Search Transactions
**Priority:** P2 (Medium)
**Preconditions:** Multiple transactions exist

**Steps:**
1. Navigate to Scheduler page
2. Use search box
3. Type: `Salary`
4. View results

**Expected Result:**
- ✅ Search box visible at top of page
- ✅ Real-time search (results update as you type)
- ✅ Results show transactions matching "Salary" in:
  - Name
  - Category
  - Note
- ✅ Highlights matched text (optional)
- ✅ Shows result count

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## Module 6: Forecast

### TC-FOR-001: View Forecast Chart - Default Period
**Priority:** P0 (Critical)
**Preconditions:**
- User has accounts with balances
- User has recurring transactions set up

**Steps:**
1. Navigate to Dashboard
2. View forecast chart

**Expected Result:**
- ✅ Chart displays default period: -6 months to +24 months from today
- ✅ **Stacked areas visible:**
  - Blue: Liquid Assets (checking + savings + cash)
  - Green: Investments (investment + retirement)
  - Red: Credit Used (negative area below zero line)
  - Orange: Loans Receivable (optional)
- ✅ **Vertical line marking "Today"**
- ✅ X-axis: dates labeled clearly (MMM YYYY)
- ✅ Y-axis: currency amounts with $ symbol
- ✅ Legend shows all categories
- ✅ Chart is responsive (fills container width)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-FOR-002: Forecast Calculation Accuracy
**Priority:** P0 (Critical)
**Preconditions:**
- Main Checking: $5,000 initial balance (Nov 1)
- Recurring income: $5,000 monthly on 25th (starting Nov 25)
- Recurring expense: $1,500 monthly on 1st (starting Dec 1)

**Steps:**
1. View forecast chart
2. Hover over Dec 1, 2025 data point
3. Hover over Dec 25, 2025 data point
4. Hover over Jan 1, 2026 data point

**Expected Result:**
- ✅ **Nov 1:** $5,000 (initial)
- ✅ **Nov 25:** $10,000 (5000 + 5000 salary)
- ✅ **Dec 1:** $8,500 (10000 - 1500 rent)
- ✅ **Dec 25:** $13,500 (8500 + 5000 salary)
- ✅ **Jan 1:** $12,000 (13500 - 1500 rent)
- ✅ Calculations match expected values
- ✅ No rounding errors visible

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-FOR-003: Forecast with Transfer Transactions
**Priority:** P1 (High)
**Preconditions:**
- Main Checking: $5,000
- Savings: $15,000
- Transfer: $1,000 monthly from Checking to Savings on 28th

**Steps:**
1. View forecast
2. Check balances before and after transfer date

**Expected Result:**
- ✅ **Before transfer (e.g., Nov 27):**
  - Checking: higher balance
  - Savings: lower balance
- ✅ **After transfer (e.g., Nov 28):**
  - Checking: decreased by $1,000
  - Savings: increased by $1,000
- ✅ **Total Liquid Assets unchanged** (transfer is internal)
- ✅ Net worth remains constant on transfer dates

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-FOR-004: Change Forecast Date Range
**Priority:** P1 (High)
**Preconditions:** Dashboard with forecast loaded

**Steps:**
1. View Dashboard forecast
2. Use date range filter/selector
3. Change to: **+12 months only** (next year)
4. Apply filter

**Expected Result:**
- ✅ Filter controls visible (date pickers or dropdown)
- ✅ Chart updates to show only next 12 months
- ✅ X-axis rescales appropriately
- ✅ Data points recalculated for new range
- ✅ Loading indicator shown during recalculation (if applicable)
- ✅ Chart animates smoothly to new range

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-FOR-005: Forecast Negative Balance Scenario
**Priority:** P1 (High)
**Preconditions:**
- Account with $1,000 balance
- Recurring expense: $500 monthly
- Recurring income: $200 monthly
- Net monthly: -$300

**Steps:**
1. Set up scenario above
2. View forecast for next 6 months
3. Check when balance goes negative

**Expected Result:**
- ✅ Forecast shows declining balance
- ✅ **Balance crosses zero** around month 4 (1000 / 300 ≈ 3.3 months)
- ✅ Negative balance shown clearly (red area or below zero line)
- ✅ **Alert on Dashboard:** "Forecast shows negative balance in [Month]"
- ✅ Warning icon or color coding on chart

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-FOR-006: Forecast Updates After Transaction Change
**Priority:** P1 (High)
**Preconditions:** Forecast visible on dashboard

**Steps:**
1. View current forecast (note balances)
2. Navigate to Scheduler
3. Edit recurring salary: increase from $5,000 to $6,000
4. Save changes
5. Return to Dashboard

**Expected Result:**
- ✅ Forecast chart automatically updates (or after page refresh)
- ✅ Future balance values increase by $1,000 per month
- ✅ Chart visually reflects higher income trajectory
- ✅ Summary cards update (Net Worth increases)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## Module 7: Reconciliation

### TC-REC-001: Reconcile Account - Exact Match
**Priority:** P1 (High)
**Preconditions:**
- Account "Main Checking" exists
- Forecast shows expected balance: $5,000 on Nov 15
- Actual bank balance: $5,000

**Steps:**
1. Navigate to Accounts page
2. Click on "Main Checking"
3. Click "Reconcile" button
4. Fill in form:
   - Date: `2025-11-15`
   - Actual Balance: `5000.00`
   - Note: `Checked bank app - matches` (optional)
5. Click "Reconcile" or "Save"

**Expected Result:**
- ✅ Success message: "Reconciliation completed successfully"
- ✅ Shows:
  - Expected: $5,000.00
  - Actual: $5,000.00
  - **Difference: $0.00** (perfect match)
- ✅ **No adjustment transaction created** (since difference is zero)
- ✅ Reconciliation record saved in history
- ✅ "Last reconciled" date updates to Nov 15
- ✅ No alerts shown

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-REC-002: Reconcile Account - Positive Difference
**Priority:** P0 (Critical)
**Preconditions:**
- Account forecast shows: $5,000 expected
- Actual bank balance: $5,230 (found extra money!)

**Steps:**
1. Open "Main Checking" account
2. Click "Reconcile"
3. Fill in:
   - Date: today
   - Actual Balance: `5230.00`
   - Note: `Found error - forgot to record freelance payment`
4. Save

**Expected Result:**
- ✅ Shows difference: **+$230.00** (positive)
- ✅ Success message
- ✅ **Adjustment transaction created:**
  - Type: Income
  - Amount: $230.00
  - Category: "Adjustment" or "Other Income"
  - Account: Main Checking
  - Date: reconciliation date
  - Note: includes reconciliation reference
- ✅ Forecast updates: all future balances increase by $230
- ✅ Chart adjusts upward from reconciliation date
- ✅ Reconciliation saved to history

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-REC-003: Reconcile Account - Negative Difference
**Priority:** P0 (Critical)
**Preconditions:**
- Account forecast shows: $5,000 expected
- Actual bank balance: $4,750 (missing money!)

**Steps:**
1. Reconcile "Main Checking"
2. Actual Balance: `4750.00`
3. Note: `Forgot to record ATM withdrawal`
4. Save

**Expected Result:**
- ✅ Difference: **-$250.00** (negative)
- ✅ **Adjustment transaction created:**
  - Type: Expense
  - Amount: $250.00
  - Category: "Adjustment" or "Other Expense"
  - Account: Main Checking
- ✅ Forecast updates: balances decrease by $250
- ✅ Chart adjusts downward from reconciliation date
- ✅ Reconciliation history updated

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-REC-004: View Reconciliation History
**Priority:** P2 (Medium)
**Preconditions:** Multiple reconciliations performed on account

**Steps:**
1. Open account detail page
2. Navigate to "Reconciliation History" tab/section

**Expected Result:**
- ✅ Table/list of all reconciliations for this account
- ✅ Columns:
  - Date
  - Expected Balance
  - Actual Balance
  - Difference (+/- and amount)
  - Note
  - Created timestamp
- ✅ Sorted by date (newest first)
- ✅ Color coding for differences:
  - Green: positive difference
  - Red: negative difference
  - Gray: zero difference

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-REC-005: Dashboard Alert - Reconciliation Needed
**Priority:** P2 (Medium)
**Preconditions:**
- Account exists
- Last reconciliation was >60 days ago

**Steps:**
1. Navigate to Dashboard
2. View "Alerts" or "Attention Required" section

**Expected Result:**
- ✅ Alert displayed: "Last reconciliation was X days ago"
- ✅ Recommendation: "Check your accounts"
- ✅ Action button: "Reconcile Now" (links to accounts page)
- ✅ Alert is dismissible or automatically clears after reconciliation

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-REC-006: Delete Reconciliation Record
**Priority:** P2 (Medium)
**Preconditions:** Reconciliation record exists

**Steps:**
1. View reconciliation history
2. Click "Delete" on a reconciliation record
3. Confirm deletion

**Expected Result:**
- ✅ Confirmation dialog shown
- ✅ Record removed from history
- ✅ Associated adjustment transaction is also removed
- ✅ Forecast recalculates without this reconciliation point
- ✅ Success message displayed

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## Module 8: Settings

### TC-SET-001: View User Profile
**Priority:** P2 (Medium)
**Preconditions:** User logged in

**Steps:**
1. Navigate to Settings page (from user menu or sidebar)
2. View Profile section

**Expected Result:**
- ✅ Page title: "Settings" or "User Settings"
- ✅ **Profile section displays:**
  - Email: (read-only, cannot edit in MVP)
  - Name: editable field
  - Base Currency: dropdown (USD, EUR, GBP, etc.)
  - Date Format: dropdown (DD.MM.YYYY, MM/DD/YYYY, YYYY-MM-DD)
- ✅ All fields show current values
- ✅ "Save" button visible

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-SET-002: Update User Name
**Priority:** P2 (Medium)
**Preconditions:** User logged in

**Steps:**
1. Navigate to Settings → Profile
2. Update Name field: `John Doe`
3. Click "Save"

**Expected Result:**
- ✅ Success message: "Profile updated successfully"
- ✅ Name updates in:
  - Settings page
  - User menu/profile display
  - Navigation bar (if shown)
- ✅ Changes persist after logout/login

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-SET-003: Change Base Currency
**Priority:** P1 (High)
**Preconditions:**
- User has accounts in USD
- Current base currency: USD

**Steps:**
1. Navigate to Settings → Profile
2. Change Base Currency: `USD` → `EUR`
3. Save changes
4. Navigate to Dashboard

**Expected Result:**
- ✅ Warning/confirmation: "Changing base currency will recalculate all reports"
- ✅ Success message after save
- ✅ **Dashboard updates:**
  - All amounts displayed in EUR
  - Currency symbol changes: $ → €
  - Values converted using current exchange rate
- ✅ **Accounts keep original currency:**
  - USD account still stored as USD
  - Conversion happens only for display
- ✅ Forecast chart recalculates in EUR

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-SET-004: Change Date Format
**Priority:** P2 (Medium)
**Preconditions:** User logged in

**Steps:**
1. Navigate to Settings
2. Change Date Format: `MM/DD/YYYY` → `DD.MM.YYYY`
3. Save
4. Navigate to Accounts and Scheduler

**Expected Result:**
- ✅ Success message
- ✅ **All dates across app update:**
  - Account created dates: 15.11.2025 (instead of 11/15/2025)
  - Transaction dates
  - Reconciliation dates
  - Chart X-axis labels
- ✅ Date pickers use new format
- ✅ Consistent formatting everywhere

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-SET-005: Change Password - Success
**Priority:** P1 (High)
**Preconditions:** User logged in with known password

**Steps:**
1. Navigate to Settings → Security section
2. Click "Change Password"
3. Fill in form:
   - Current Password: `Test123!`
   - New Password: `NewPass456!`
   - Confirm New Password: `NewPass456!`
4. Click "Update Password"

**Expected Result:**
- ✅ Success message: "Password updated successfully"
- ✅ User remains logged in
- ✅ Form clears/closes
- ✅ **Test new password:**
  - Logout
  - Login with new password: NewPass456!
  - Login succeeds

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-SET-006: Logout All Devices
**Priority:** P2 (Medium)
**Preconditions:**
- User logged in on current device
- (Simulated) User logged in on another device/browser

**Steps:**
1. Navigate to Settings → Security
2. Click "Logout All Devices" or "Logout Everywhere"
3. Confirm action

**Expected Result:**
- ✅ Confirmation dialog: "This will log you out from all devices"
- ✅ Success message
- ✅ **Current session:**
  - User remains logged in on current device
  - Access token still valid
- ✅ **Other sessions:**
  - All refresh tokens invalidated
  - Other devices/browsers logged out
- ✅ Backend: refresh_tokens table updated (is_revoked = true)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### TC-SET-007: View Regional Settings
**Priority:** P3 (Low)
**Preconditions:** User logged in

**Steps:**
1. Navigate to Settings → Regional
2. View available options

**Expected Result:**
- ✅ **Regional settings visible:**
  - Thousand Separator: dropdown (space, comma, dot)
  - Decimal Separator: dropdown (dot, comma)
  - Time Zone: dropdown (optional for MVP)
- ✅ Current values displayed
- ✅ Changes update number formatting across app
  - Example: 1,000.00 → 1 000,00 (if using space + comma)

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## End-to-End Scenarios

### E2E-001: Complete New User Journey
**Priority:** P0 (Critical)
**Estimated Time:** 15 minutes

**Scenario:** New user signs up and sets up basic financial plan

**Steps:**

1. **Registration**
   - Navigate to app
   - Register with testuser3@example.com / Test123!
   - Select USD as currency
   - ✅ Redirected to Dashboard (empty state)

2. **Create First Account**
   - Click "Add Account" from empty state
   - Create "Main Checking" - $5,000
   - ✅ Account created, Dashboard shows $5,000 liquid assets

3. **Create Second Account**
   - Add "Savings" - $15,000
   - ✅ Total liquid: $20,000

4. **Add Recurring Income**
   - Go to Scheduler
   - Add "Monthly Salary" - $5,000, monthly on 25th
   - ✅ Transaction created

5. **Add Recurring Expenses**
   - Add "Rent" - $1,500, monthly on 1st
   - Add "Groceries" - $500, monthly on 5th
   - ✅ Both created

6. **Add Savings Transfer**
   - Add "To Savings" - $1,000 transfer, monthly on 28th
   - ✅ Transfer created

7. **View Forecast**
   - Return to Dashboard
   - ✅ Forecast chart shows:
     - Initial balance: $20,000
     - Monthly income: +$5,000 on 25th
     - Monthly expenses: -$2,000 (rent + groceries)
     - Monthly transfer: internal movement
     - Net growth: ~$3,000/month

8. **Verify Calculations**
   - Hover over data points
   - ✅ Balances increase over time
   - ✅ Liquid assets grow

9. **Perform Reconciliation**
   - Open "Main Checking"
   - Reconcile with actual balance
   - ✅ Reconciliation completed

10. **Update Profile**
    - Go to Settings
    - Update name to "Test User"
    - ✅ Profile updated

**Expected Result:**
- ✅ Complete flow works seamlessly
- ✅ User can create working financial plan in <10 minutes
- ✅ No errors encountered
- ✅ All data persists
- ✅ Forecast is accurate

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_
**Time Taken:** _[minutes]_

---

### E2E-002: Plan Large Purchase Scenario
**Priority:** P1 (High)
**Estimated Time:** 10 minutes

**Scenario:** User wants to buy a car and checks if they can afford it

**Preconditions:**
- User has accounts set up
- Monthly income: $5,000
- Monthly expenses: $2,000
- Current liquid assets: $20,000

**Steps:**

1. **Add One-Time Expense**
   - Go to Scheduler
   - Add "Car Purchase" - $25,000, one-time on Aug 15, 2026
   - ✅ Transaction created

2. **Check Forecast**
   - View Dashboard
   - Navigate to Aug 2026 on chart
   - ✅ See balance drop by $25,000

3. **Analyze Impact**
   - Check if balance goes negative after purchase
   - Initial calculation:
     - Starting: $20,000
     - 9 months growth: 9 × $3,000 = $27,000
     - Balance before purchase: $47,000
     - After car: $22,000
   - ✅ Balance remains positive

4. **Adjust Purchase Date**
   - Edit "Car Purchase"
   - Change date to Mar 15, 2026 (earlier)
   - ✅ Transaction updated

5. **Recheck Forecast**
   - View March 2026
   - New calculation:
     - 4 months growth: $12,000
     - Balance before: $32,000
     - After car: $7,000
   - ✅ Still positive, but tighter

6. **Decision**
   - User decides August is safer
   - Change back to Aug 15, 2026
   - ✅ Final plan set

**Expected Result:**
- ✅ User can model "what-if" scenarios
- ✅ Forecast updates immediately after changes
- ✅ Easy to compare different dates
- ✅ Helps user make informed decision

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### E2E-003: Salary Increase Scenario
**Priority:** P1 (High)
**Estimated Time:** 8 minutes

**Scenario:** User gets promotion with salary increase starting in January

**Preconditions:**
- Recurring "Monthly Salary" - $5,000 since Jan 2025

**Steps:**

1. **Edit Recurring Transaction**
   - Go to Scheduler
   - Edit "Monthly Salary" for Jan 2026 instance
   - ✅ Edit modal opens

2. **Select "This and Future"**
   - Choose update mode: "This and future occurrences"
   - ✅ Continue

3. **Update Salary**
   - Change amount: $5,000 → $6,500
   - Note: "Promotion effective Jan 2026"
   - Save
   - ✅ Transaction split created

4. **Verify Split**
   - View recurring transactions list
   - ✅ Two entries:
     - "Monthly Salary" - $5,000 (ends Dec 2025)
     - "Monthly Salary" - $6,500 (starts Jan 2026)

5. **Check Forecast**
   - View Dashboard chart
   - ✅ Stepped increase visible in Jan 2026
   - ✅ Future balances higher by $1,500/month

6. **Verify Calendar**
   - Go to Calendar view
   - ✅ Dec 2025: $5,000
   - ✅ Jan 2026: $6,500
   - ✅ Feb 2026: $6,500

**Expected Result:**
- ✅ "This and future" mode works correctly
- ✅ Clean split at specified date
- ✅ Past data unchanged
- ✅ Future data updated
- ✅ Forecast reflects change

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

### E2E-004: Periodic Reconciliation Flow
**Priority:** P1 (High)
**Estimated Time:** 5 minutes

**Scenario:** User checks bank balances quarterly and reconciles

**Preconditions:**
- User has "Main Checking" and "Savings" accounts
- 3 months passed since last reconciliation

**Steps:**

1. **Check Bank Balances**
   - (Simulate) User checks mobile banking:
     - Checking: $8,230
     - Savings: $18,750

2. **Reconcile Checking**
   - Open "Main Checking" account
   - Click "Reconcile"
   - Expected (from forecast): $8,000
   - Actual: $8,230
   - Difference: +$230
   - Note: "Forgot to log cash deposit"
   - Save
   - ✅ Adjustment created (+$230)

3. **Reconcile Savings**
   - Open "Savings" account
   - Reconcile
   - Expected: $19,000
   - Actual: $18,750
   - Difference: -$250
   - Note: "Bank fee I missed"
   - Save
   - ✅ Adjustment created (-$250)

4. **View Updated Forecast**
   - Return to Dashboard
   - ✅ Forecast adjusted:
     - Checking: +$230
     - Savings: -$250
     - Net: -$20 (minor correction)

5. **Check Reconciliation History**
   - View both accounts
   - ✅ History shows today's reconciliations
   - ✅ Differences logged

**Expected Result:**
- ✅ Reconciliation process is straightforward
- ✅ Adjustments calculated correctly
- ✅ Forecast syncs with reality
- ✅ History maintained

**Actual Result:** _[To be filled by tester]_
**Status:** _[Pass/Fail]_

---

## Test Execution Summary

**Tester Name:** _______________
**Test Date:** _______________
**Build/Version:** _______________
**Environment:** _______________

### Results Summary

| Module | Total Tests | Passed | Failed | Blocked | Pass Rate |
|--------|-------------|--------|--------|---------|-----------|
| Authentication | 5 | | | | |
| Dashboard | 4 | | | | |
| Accounts | 8 | | | | |
| Categories | 4 | | | | |
| Scheduler | 16 | | | | |
| Forecast | 6 | | | | |
| Reconciliation | 6 | | | | |
| Settings | 7 | | | | |
| E2E Scenarios | 4 | | | | |
| **TOTAL** | **60** | | | | **%** |

### Critical Issues Found
_[List any P0/P1 issues discovered]_

1.
2.
3.

### Recommendations
_[Any suggestions for improvement]_

1.
2.
3.

### Sign-off

**Tester Signature:** _______________
**Date:** _______________

---

## Appendix A: Test Case Priority Levels

- **P0 (Critical):** Core functionality, must work for MVP release
- **P1 (High):** Important features, should work for good UX
- **P2 (Medium):** Nice-to-have features, can be fixed post-launch
- **P3 (Low):** Minor features, non-blocking

## Appendix B: Test Data Cleanup

After testing, reset database:

```bash
# Drop all tables and recreate
cd backend
make db-reset

# Or manually delete test users
psql -d finforesight -c "DELETE FROM users WHERE email LIKE 'testuser%@example.com';"
```

## Appendix C: Known Limitations (MVP)

- ❌ No mobile responsive design (desktop only)
- ❌ No email verification
- ❌ No password reset
- ❌ No multi-currency conversion (stored but not converted)
- ❌ No weekly/daily recurrence patterns
- ❌ No custom categories (system only)
- ❌ No analysis module beyond basic reconciliation

---

**End of Test Suite**
