# FinForesight - Manual Test Suite

## Test Environment Setup
- **Backend URL:** http://localhost:8000
- **Frontend URL:** http://localhost:4200
- **Test Browser:** Chrome/Firefox (latest version)
- **Screen Resolution:** 1920x1080 (desktop)

---

## 1. Authentication Module

### TC-AUTH-001: User Registration (Success Path)
**Priority:** High
**Preconditions:** None

**Steps:**
1. Navigate to http://localhost:4200
2. Click "Register" or "Sign Up" link
3. Fill in registration form:
   - Full Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
4. Click "Register" button

**Expected Results:**
- Registration successful message displayed
- User automatically logged in
- Redirected to Dashboard

---

### TC-AUTH-002: User Login (Success Path)
**Priority:** High
**Preconditions:** User already registered (use TC-AUTH-001)

**Steps:**
1. If logged in, logout first
2. Navigate to http://localhost:4200
3. Fill in login form:
   - Email: "testuser@example.com"
   - Password: "SecurePass123!"
4. Click "Login" button

**Expected Results:**
- Login successful
- Access token stored
- Redirected to Dashboard
- User info visible in header/profile section

---

### TC-AUTH-003: Auto-Login on Page Refresh
**Priority:** Medium
**Preconditions:** User logged in (TC-AUTH-002)

**Steps:**
1. While logged in, refresh the page (F5 or Ctrl+R)
2. Observe the application state

**Expected Results:**
- User remains logged in
- No redirect to login page
- Dashboard data loads correctly
- User info still visible

---

### TC-AUTH-004: Logout
**Priority:** High
**Preconditions:** User logged in (TC-AUTH-002)

**Steps:**
1. Click on user profile menu/avatar
2. Click "Logout" option

**Expected Results:**
- User logged out successfully
- Access token cleared
- Redirected to Login page
- Cannot access protected routes

---

## 2. Accounts Module

### TC-ACC-001: Create Checking Account (Success Path)
**Priority:** High
**Preconditions:** User logged in

**Steps:**
1. Navigate to "Accounts" page
2. Click "Add Account" or "+" button
3. Fill in account form:
   - Account Name: "My Checking Account"
   - Account Type: "Checking"
   - Currency: "USD" (or default)
   - Current Balance: "5000.00"
   - Description: "Primary checking account"
4. Click "Save" or "Create" button

**Expected Results:**
- Success message displayed
- New account appears in accounts list
- Account shows correct name, type, and balance
- Financial summary updated

---

### TC-ACC-002: Create Multiple Account Types
**Priority:** High
**Preconditions:** User logged in

**Steps:**
1. Create Savings Account:
   - Name: "Emergency Fund"
   - Type: "Savings"
   - Balance: "10000.00"
2. Create Credit Card Account:
   - Name: "Visa Card"
   - Type: "Credit Card"
   - Balance: "-1500.00" (negative value represents current debt)
   - Credit Limit: "5000.00" (optional)
3. Create Investment Account:
   - Name: "Stock Portfolio"
   - Type: "Investment"
   - Balance: "25000.00"

**Expected Results:**
- All 3 accounts created successfully
- Each account displays with correct type icon/badge
- Balances displayed correctly (negative for credit card showing debt)
- Financial summary shows:
  - Liquid Assets (Checking + Savings)
  - Investments
  - Credit/Debt (shows $1,500.00 as credit used)
  - Net Worth calculation (liquid + investments - credit)

**Notes:**
- For credit cards and loans, enter a **negative value** to represent debt (e.g., -1500.00 means you owe $1,500)
- Positive value would represent overpayment/credit balance
- The form displays a hint when creating credit card/loan accounts
- Backend uses `abs(balance)` to calculate credit used in financial summary

---

### TC-ACC-003: View Account Details
**Priority:** Medium
**Preconditions:** At least one account created (TC-ACC-001)

**Steps:**
1. From Accounts list, click on "My Checking Account"
2. View account details page/modal

**Expected Results:**
- Account details displayed:
  - Name
  - Type
  - Balance
  - Currency
  - Description
  - Created date
- Option to Edit or Delete visible

---

### TC-ACC-004: Edit Account
**Priority:** High
**Preconditions:** At least one account created (TC-ACC-001)

**Steps:**
1. Click "Edit" button on "My Checking Account"
2. Modify fields:
   - Account Name: "Primary Checking"
   - Balance: "5500.00"
   - Description: "Updated description"
3. Click "Save" button

**Expected Results:**
- Success message displayed
- Account name updated in list
- Balance updated correctly
- Description saved
- Financial summary recalculated

---

### TC-ACC-005: Delete Account
**Priority:** Medium
**Preconditions:** At least two accounts created

**Steps:**
1. Click "Delete" button on one account
2. Confirm deletion in confirmation dialog

**Expected Results:**
- Confirmation dialog appears
- After confirmation, account removed from list
- Success message displayed
- Financial summary recalculated
- Account soft-deleted (not visible in list)

---

### TC-ACC-006: View Financial Summary
**Priority:** High
**Preconditions:** Multiple accounts of different types created (TC-ACC-002)

**Steps:**
1. Navigate to Accounts page
2. View the financial summary section

**Expected Results:**
- Liquid Assets total = Checking + Savings
- Investments total = Investment accounts
- Credit/Debt total = Credit Card + Loan balances
- Net Worth = Liquid Assets + Investments - Credit/Debt
- All calculations correct

---

## 3. Categories Module

### TC-CAT-001: View System Categories
**Priority:** Medium
**Preconditions:** User logged in

**Steps:**
1. Navigate to "Categories" page
2. View the list of categories

**Expected Results:**
- System categories displayed (20 default categories)
- Categories grouped by type:
  - Income categories
  - Expense categories
  - Transfer categories
- Each category shows name and type
- System categories cannot be deleted

---

### TC-CAT-002: Create Custom Category (Success Path)
**Priority:** High
**Preconditions:** User logged in

**Steps:**
1. Click "Add Category" button
2. Fill in category form:
   - Name: "Freelance Income"
   - Type: "Income"
   - Description: "Income from freelance projects"
3. Click "Save" button

**Expected Results:**
- Success message displayed
- New category appears in list
- Category shows "Custom" or user-specific indicator
- Category available for selection in transactions

---

### TC-CAT-003: Create Expense Category
**Priority:** High
**Preconditions:** User logged in

**Steps:**
1. Create custom expense category:
   - Name: "Pet Expenses"
   - Type: "Expense"
   - Description: "Food, vet, supplies for pets"

**Expected Results:**
- Custom expense category created
- Appears in expense categories section
- Available in transaction dropdowns

---

### TC-CAT-004: Edit Custom Category
**Priority:** Medium
**Preconditions:** Custom category created (TC-CAT-002)

**Steps:**
1. Click "Edit" on "Freelance Income" category
2. Update:
   - Name: "Freelance & Consulting"
   - Description: "Updated description"
3. Click "Save"

**Expected Results:**
- Category name updated
- Changes reflected immediately
- Still available in transaction forms

---

### TC-CAT-005: Delete Custom Category
**Priority:** Low
**Preconditions:** Custom category created, not used in transactions

**Steps:**
1. Click "Delete" on custom category
2. Confirm deletion

**Expected Results:**
- Category deleted successfully
- Removed from list
- Not available in transaction forms

---

## 4. Scheduler Module

### TC-SCH-001: Create One-Time Transaction (Success Path)
**Priority:** High
**Preconditions:** User logged in, at least one account and category exist

**Steps:**
1. Navigate to "Scheduler" page
2. Click "Add Transaction" button
3. Fill in form:
   - Type: "One-time"
   - Description: "Salary Payment"
   - Amount: "4500.00"
   - Category: "Salary" (Income)
   - Account: "My Checking Account"
   - Date: Select date (e.g., 1st of next month)
4. Click "Save"

**Expected Results:**
- Success message displayed
- Transaction appears in scheduler list
- Shows correct date, amount, category
- Marked as "One-time"

---

### TC-SCH-002: Create Monthly Recurring Transaction
**Priority:** High
**Preconditions:** User logged in, accounts exist

**Steps:**
1. Click "Add Transaction"
2. Fill in form:
   - Type: "Recurring"
   - Recurrence: "Monthly"
   - Description: "Rent Payment"
   - Amount: "1200.00"
   - Category: "Housing" (Expense)
   - Account: "My Checking Account"
   - Start Date: 1st of current month
   - (No end date - ongoing)
   - Day of Month: 1
3. Click "Save"

**Expected Results:**
- Recurring transaction created
- Shows "Monthly" recurrence indicator
- Displays next occurrence date
- Appears in calendar view on correct day each month

---

### TC-SCH-003: Create Yearly Recurring Transaction
**Priority:** Medium
**Preconditions:** User logged in, accounts exist

**Steps:**
1. Create yearly transaction:
   - Type: "Recurring"
   - Recurrence: "Yearly"
   - Description: "Car Insurance"
   - Amount: "1800.00"
   - Category: "Insurance" (Expense)
   - Account: "My Checking Account"
   - Start Date: January 15
   - Month: 1 (January)
   - Day: 15

**Expected Results:**
- Yearly transaction created
- Shows correct recurrence pattern
- Next occurrence on January 15

---

### TC-SCH-004: Create Transfer Transaction
**Priority:** High
**Preconditions:** At least 2 accounts exist

**Steps:**
1. Create transaction:
   - Description: "Monthly Savings Transfer"
   - Amount: "500.00"
   - Category: "Transfer"
   - From Account: "My Checking Account"
   - To Account: "Emergency Fund"
   - Type: "Recurring - Monthly"
   - Day: 5

**Expected Results:**
- Transfer transaction created
- Shows both from/to accounts
- Category is "Transfer"
- Amount deducted from checking, added to savings in forecast

---

### TC-SCH-005: View Calendar View
**Priority:** Medium
**Preconditions:** Multiple transactions created

**Steps:**
1. Switch to "Calendar" view in Scheduler
2. Navigate through different months

**Expected Results:**
- Transactions displayed on correct dates
- Color-coded by type (Income/Expense/Transfer)
- Shows transaction description and amount
- Can click on transaction to view details
- Recurring transactions appear in future months

---

### TC-SCH-006: Edit One-Time Transaction
**Priority:** High
**Preconditions:** One-time transaction exists (TC-SCH-001)

**Steps:**
1. Click on "Salary Payment" transaction
2. Click "Edit" button
3. Modify:
   - Amount: "4800.00"
   - Date: Change to different date
4. Click "Save"

**Expected Results:**
- Transaction updated
- New amount and date reflected
- Changes visible in calendar

---

### TC-SCH-007: Edit Recurring Transaction - Update All
**Priority:** High
**Preconditions:** Recurring transaction exists (TC-SCH-002)

**Steps:**
1. Click on "Rent Payment" recurring transaction
2. Click "Edit"
3. Change amount: "1250.00"
4. Select update mode: "All future occurrences"
5. Click "Save"

**Expected Results:**
- Confirmation dialog shows update mode options
- All future instances updated with new amount
- Past instances remain unchanged
- Calendar reflects new amount going forward

---

### TC-SCH-008: Edit Recurring Transaction - Update This Only
**Priority:** Medium
**Preconditions:** Recurring transaction exists

**Steps:**
1. Select specific instance of "Rent Payment"
2. Click "Edit"
3. Change amount: "1300.00" (one-time increase)
4. Select: "This occurrence only"
5. Click "Save"

**Expected Results:**
- Only selected instance updated
- Creates exception record
- Other instances remain at original amount
- Calendar shows different amount for this instance only

---

### TC-SCH-009: Edit Recurring Transaction - Update This and Future
**Priority:** Medium
**Preconditions:** Recurring transaction exists

**Steps:**
1. Select future instance of recurring transaction
2. Edit amount or details
3. Select: "This and all future occurrences"
4. Save

**Expected Results:**
- Selected instance and all future updated
- Past instances unchanged
- New pattern starts from selected date

---

### TC-SCH-010: Delete One-Time Transaction
**Priority:** Medium
**Preconditions:** One-time transaction exists

**Steps:**
1. Click delete on one-time transaction
2. Confirm deletion

**Expected Results:**
- Transaction deleted
- Removed from calendar
- No longer appears in forecast

---

### TC-SCH-011: Delete Recurring Transaction - All
**Priority:** Medium
**Preconditions:** Recurring transaction exists

**Steps:**
1. Click delete on recurring transaction
2. Select "Delete all occurrences"
3. Confirm

**Expected Results:**
- All future instances removed
- Transaction removed from calendar
- No longer appears in forecast

---

### TC-SCH-012: View Transaction Statistics
**Priority:** Low
**Preconditions:** Multiple transactions created

**Steps:**
1. Navigate to Statistics section in Scheduler
2. View summary data

**Expected Results:**
- Total scheduled income shown
- Total scheduled expenses shown
- Net amount calculated
- Breakdown by category
- Count of transactions

---

### TC-SCH-013: Filter Transactions by Type
**Priority:** Low
**Preconditions:** Transactions of different types exist

**Steps:**
1. Use filter dropdown to select "Income only"
2. Then filter "Expense only"
3. Then filter "Transfer only"

**Expected Results:**
- Filters work correctly
- Only selected type displayed
- Calendar updates accordingly
- Statistics recalculate for filtered view

---

### TC-SCH-014: Filter Transactions by Account
**Priority:** Low
**Preconditions:** Transactions in multiple accounts

**Steps:**
1. Filter by specific account
2. View results

**Expected Results:**
- Only transactions for selected account shown
- Transfers involving the account included
- Other accounts' transactions hidden

---

## 5. Dashboard Module

### TC-DASH-001: View Dashboard Summary (Success Path)
**Priority:** High
**Preconditions:** User logged in, accounts and transactions exist

**Steps:**
1. Navigate to Dashboard (usually default landing page)
2. View all dashboard sections

**Expected Results:**
- Summary cards displayed:
  - Liquid Assets (with amount)
  - Investments (with amount)
  - Credit/Debt (with amount)
  - Net Worth (with amount)
- All amounts match financial summary
- Color coding appropriate (green for positive, red for negative)

---

### TC-DASH-002: View Balance Forecast Chart
**Priority:** High
**Preconditions:** Accounts and scheduled transactions exist

**Steps:**
1. View the balance forecast chart on Dashboard
2. Hover over data points
3. Check legend and axis labels

**Expected Results:**
- Chart displays future balance projections
- Multiple lines if multiple accounts
- X-axis shows dates
- Y-axis shows balance amounts
- Tooltip shows exact values on hover
- Account transactions affect projections correctly

---

### TC-DASH-003: View Upcoming Transactions
**Priority:** Medium
**Preconditions:** Scheduled transactions exist

**Steps:**
1. Scroll to "Upcoming Transactions" section
2. View the list

**Expected Results:**
- Next 5-10 transactions displayed
- Sorted by date (earliest first)
- Shows:
  - Date
  - Description
  - Amount
  - Category
  - Account
- Color-coded by type (income/expense)

---

### TC-DASH-004: View 7-Day Balance Trend
**Priority:** Low
**Preconditions:** Accounts exist

**Steps:**
1. View the 7-day trend widget/chart

**Expected Results:**
- Small chart or sparkline shows last 7 days
- Trend direction indicated (up/down)
- Percentage change shown
- Current vs 7 days ago comparison

---

### TC-DASH-005: Dashboard Data Refresh
**Priority:** Medium
**Preconditions:** Dashboard loaded

**Steps:**
1. In another tab/window, add a new account or transaction
2. Return to dashboard
3. Refresh or wait for auto-refresh

**Expected Results:**
- Dashboard data updates
- New account reflected in summary
- New transaction in upcoming list
- Chart recalculates

---

## 6. Forecast Module

### TC-FOR-001: View Basic Forecast (Success Path)
**Priority:** High
**Preconditions:** User logged in, 1+ accounts, scheduled transactions exist

**Steps:**
1. Navigate to "Forecast" page
2. View default forecast

**Expected Results:**
- Forecast table/chart displayed
- Shows current account balances
- Projects future balances based on scheduled transactions
- Default date range shown (e.g., next 30 days)
- Data accurate based on scheduled transactions

---

### TC-FOR-002: Filter Forecast by Date Range
**Priority:** High
**Preconditions:** Forecast page loaded

**Steps:**
1. Change date range:
   - Start Date: Today
   - End Date: 90 days from today
2. Apply filter

**Expected Results:**
- Forecast recalculates for 90-day period
- All scheduled transactions in range included
- Chart/table expands to show full range
- Running balance calculated correctly

---

### TC-FOR-003: Filter Forecast by Account
**Priority:** Medium
**Preconditions:** Multiple accounts exist

**Steps:**
1. Select specific account from filter dropdown
2. Apply filter

**Expected Results:**
- Forecast shows only selected account
- Only transactions affecting that account included
- Balance projection specific to account
- Other accounts hidden

---

### TC-FOR-004: View Multi-Account Forecast
**Priority:** Medium
**Preconditions:** Multiple accounts with transactions

**Steps:**
1. Select "All Accounts" or multiple accounts
2. View forecast

**Expected Results:**
- Separate line/column for each account
- Total balance line if available
- Transfer transactions affect both accounts correctly
- Color-coded by account

---

### TC-FOR-005: Verify Recurring Transaction Expansion
**Priority:** High
**Preconditions:** Monthly recurring transaction exists

**Steps:**
1. View forecast for next 6 months
2. Check that monthly transaction appears each month

**Expected Results:**
- Recurring transaction appears on correct day each month
- Amount consistent (unless edited)
- Balance calculation includes all instances
- Yearly transactions appear once per year

---

### TC-FOR-006: Verify Transfer Impact
**Priority:** Medium
**Preconditions:** Transfer transaction scheduled

**Steps:**
1. View forecast with transfer transaction
2. Check both "from" and "to" accounts

**Expected Results:**
- Amount deducted from source account
- Same amount added to destination account
- Net worth unchanged (internal transfer)
- Both accounts show correct projected balances

---

### TC-FOR-007: Forecast with No Transactions
**Priority:** Low
**Preconditions:** Account exists but no scheduled transactions

**Steps:**
1. View forecast for account with no transactions
2. Check projection

**Expected Results:**
- Flat line at current balance
- No changes projected
- Message indicating no scheduled transactions (optional)

---

## 7. Reconciliation Module

### TC-REC-001: Create Reconciliation (Success Path)
**Priority:** High
**Preconditions:** Account exists with known balance

**Steps:**
1. Navigate to "Reconciliation" page
2. Click "Add Reconciliation"
3. Fill in form:
   - Account: "My Checking Account"
   - Reconciliation Date: Today's date
   - Actual Balance: "5300.00"
   - Expected Balance: (auto-calculated from forecast)
   - Notes: "Monthly reconciliation"
4. Click "Save"

**Expected Results:**
- Reconciliation record created
- Difference calculated automatically (Actual - Expected)
- If difference ≠ 0, adjustment transaction offered
- Record appears in reconciliation history
- Shows status (Matched/Unmatched)

---

### TC-REC-002: Reconciliation with Perfect Match
**Priority:** Medium
**Preconditions:** Account balance matches forecast exactly

**Steps:**
1. Create reconciliation where Actual = Expected
2. Save

**Expected Results:**
- Status shows "Matched" or "Balanced"
- Difference = 0.00
- No adjustment needed
- Green indicator or success badge

---

### TC-REC-003: Reconciliation with Discrepancy
**Priority:** High
**Preconditions:** Account balance differs from forecast

**Steps:**
1. Create reconciliation:
   - Actual Balance: "5200.00"
   - Expected Balance: "5300.00"
   - Difference: "-100.00"
2. Save

**Expected Results:**
- Status shows "Unmatched" or discrepancy
- Difference highlighted (-$100)
- Option to create adjustment transaction
- Can add notes explaining discrepancy

---

### TC-REC-004: Create Adjustment Transaction
**Priority:** High
**Preconditions:** Reconciliation with discrepancy exists (TC-REC-003)

**Steps:**
1. After creating reconciliation with discrepancy
2. Click "Create Adjustment" button
3. Review auto-populated adjustment transaction:
   - Account: Same as reconciliation
   - Amount: Difference amount
   - Category: "Adjustment" or similar
   - Description: Auto-generated
4. Confirm creation

**Expected Results:**
- Adjustment transaction created
- Account balance updated to match actual
- Reconciliation status updated to "Adjusted"
- Transaction appears in scheduler/history
- Forecast updated with adjustment

---

### TC-REC-005: View Reconciliation History
**Priority:** Medium
**Preconditions:** Multiple reconciliations created

**Steps:**
1. View reconciliation history list
2. Review past reconciliations

**Expected Results:**
- All reconciliations listed chronologically
- Shows:
  - Date
  - Account
  - Actual balance
  - Expected balance
  - Difference
  - Status
- Can filter by account
- Can filter by date range

---

### TC-REC-006: Delete Reconciliation
**Priority:** Low
**Preconditions:** Reconciliation exists

**Steps:**
1. Click "Delete" on a reconciliation record
2. Confirm deletion

**Expected Results:**
- Reconciliation deleted
- Removed from history
- Associated adjustment transaction NOT deleted (if exists)
- Confirmation message shown

---

### TC-REC-007: Filter Reconciliations by Account
**Priority:** Low
**Preconditions:** Reconciliations for multiple accounts exist

**Steps:**
1. Use account filter dropdown
2. Select specific account
3. View filtered results

**Expected Results:**
- Only reconciliations for selected account shown
- Other accounts' reconciliations hidden
- Filter can be cleared to show all

---

## 8. End-to-End Success Path Scenario

### TC-E2E-001: Complete User Journey
**Priority:** Critical
**Preconditions:** Fresh application state, no existing user

**Steps:**
1. **Register** new user account
2. **Create accounts:**
   - Checking: $5000
   - Savings: $10000
   - Credit Card: -$1500
3. **Create custom category:** "Freelance Income"
4. **Schedule transactions:**
   - Monthly income (Salary): $4500 on 1st
   - Monthly expense (Rent): $1200 on 1st
   - Monthly recurring transfer: $500 to savings on 5th
   - One-time expense: $200 grocery shopping
5. **View Dashboard:**
   - Verify summary cards
   - Check balance forecast
   - Review upcoming transactions
6. **View Forecast:**
   - Set 90-day range
   - Verify all recurring transactions appear
   - Check balance projection accuracy
7. **Perform Reconciliation:**
   - Check actual bank balance
   - Reconcile checking account
   - Create adjustment if needed
8. **Edit recurring transaction:**
   - Increase salary to $4800
   - Update all future occurrences
9. **View updated forecast:**
   - Verify new salary amount reflected
   - Check balance projections increased
10. **Logout and login:**
    - Verify data persists
    - All accounts, transactions, forecasts intact

**Expected Results:**
- All operations complete successfully
- Data consistent across all modules
- Financial calculations accurate
- User experience smooth and intuitive
- No errors or unexpected behavior

---

## Test Execution Notes

### Before Testing:
- Clear browser cache and cookies
- Ensure backend is running (http://localhost:8000)
- Ensure frontend is running (http://localhost:4200)
- Database migrations applied
- No errors in browser console or network tab

### During Testing:
- Document any deviations from expected results
- Take screenshots of errors
- Note browser console errors
- Check network requests (F12 > Network tab)
- Verify API responses (check status codes)

### After Testing:
- Clean up test data if needed
- Report any bugs found
- Update test cases if application behavior changed
- Mark test cases as Pass/Fail

---

## Test Coverage Summary

**Modules Covered:**
1. Authentication (4 test cases)
2. Accounts (6 test cases)
3. Categories (5 test cases)
4. Scheduler (14 test cases)
5. Dashboard (5 test cases)
6. Forecast (7 test cases)
7. Reconciliation (7 test cases)
8. End-to-End (1 comprehensive test case)

**Total Test Cases:** 49

**Priority Breakdown:**
- Critical: 1
- High: 21
- Medium: 19
- Low: 8

---

## Next Steps
After completing success path testing:
1. Add negative test cases (invalid inputs, boundary conditions)
2. Add security test cases (unauthorized access, XSS, SQL injection)
3. Add performance test cases (large datasets, concurrent users)
4. Add mobile responsive testing
5. Add cross-browser testing (Chrome, Firefox, Safari, Edge)
