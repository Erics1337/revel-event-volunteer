# E2E Tests

This directory contains end-to-end (E2E) tests for the volunteer event application using Playwright.

## Test Structure

### Main Test File
- **`auth.spec.ts`** - Authentication and volunteer flow tests

### Helper Files
- **`helpers/mail.ts`** - Email capture utilities for magic link authentication testing
- **`helpers/supabase-admin.ts`** - Supabase admin utilities for database operations during tests

## Test Scenarios

### Authentication Flow Tests (`auth.spec.ts`)

1. **Homepage Sign-In Modal**
   - Tests magic link authentication from the main page
   - Verifies profile creation with "volunteer" role
   - Checks successful redirect to homepage

2. **Open Shifts Signup**
   - Tests authentication flow when signing up for shifts as a guest
   - Verifies modal opening and magic link process
   - Confirms redirect back to open-shifts page after auth

3. **Profile Completion Modal**
   - Tests the required profile setup for new volunteers
   - Verifies modal appears for incomplete profiles (missing phone)
   - Tests successful profile completion and shift signup continuation

4. **Protected Routes**
   - Tests that `/schedule` and `/profile` pages require authentication
   - Verifies redirect to login with proper return URL
   - Confirms volunteer users cannot access admin routes

5. **Magic Link Security**
   - Tests rejection of missing or unsafe magic link parameters
   - Prevents reuse of magic links (one-time use)
   - Validates proper error handling for malformed links

## Prerequisites

### Local Development
- Node.js 20.19.0
- Supabase CLI
- Local Supabase instance running
- Next.js app running on localhost:3000

### CI Environment
- Ubuntu runner with Node.js and Supabase CLI
- Local Supabase started automatically
- Next.js dev server started automatically

## Running Tests

### Local Testing

1. **Start Supabase:**
   ```bash
   supabase start
   ```

2. **Reset Database:**
   ```bash
   npm run db:reset
   ```

3. **Start Next.js App:**
   ```bash
   npm run dev
   ```

4. **Run Specific Tests:**
   ```bash
   # Run all e2e tests
   npm run test:e2e

   # Run auth-specific tests
   npm run test:e2e:auth
   ```

5. **Run Regression Suite:**
   ```bash
   npm run test:regression
   ```
   This runs linting, build, auth static checks, and all e2e tests.

### CI Testing

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

The CI workflow (`.github/workflows/regression.yml`):
1. Sets up Node.js and installs dependencies
2. Installs Playwright browsers
3. Starts Supabase locally
4. Resets the database schema
5. Starts the Next.js dev server
6. Runs the regression test suite
7. Uploads test reports and results as artifacts

## Test Configuration

### Playwright Config (`playwright.config.ts`)
- Uses Chromium browser
- Base URL: `http://localhost:3000`
- Video recording on failure
- Screenshot on failure
- Trace collection on failure

### Environment Variables
- `PLAYWRIGHT_BASE_URL`: App URL (localhost:3000 in dev/CI)
- `MAIL_CAPTURE_URL`: Supabase mail capture URL for testing email links

## Helper Utilities

### Mail Helper (`helpers/mail.ts`)
- `clearCapturedEmails()` - Clears captured emails for a recipient
- `waitForMagicLink()` - Waits for and extracts magic link from captured emails

### Supabase Admin Helper (`helpers/supabase-admin.ts`)
- `waitForUserProfile()` - Waits for user profile creation after signup
- Database admin operations for test setup/cleanup

## Test Coverage

The tests cover critical user journeys:
- User registration and login
- Profile setup requirements
- Shift signup flow
- Route protection
- Security validations

All tests are designed to run in isolation and clean up after themselves.
