# Trial and Account Management System

This document explains how the automated trial and account management system works.

## Overview

The system automatically manages user accounts with two distinct paths:

1. **GP Authors with Codes**: Get immediate active status with no trial period
2. **Regular Users**: Get a 14-day trial, after which accounts are suspended until they subscribe

## How It Works

### For GP Authors

When a user signs up with a valid GP author code:
- Account status: `active`
- Subscription status: `free`
- Role: `author`
- No trial period
- Immediate full access to all features

### For Regular Users

When a user signs up without a GP code:
- Account status: `trial`
- Subscription status: `trial`
- Role: `user`
- Trial period: 14 days
- Full access during trial
- After trial expires: account automatically suspended

## Account Status Types

- **active**: Full access, no restrictions
- **trial**: Full access, countdown visible, time-limited
- **suspended**: Read-only access, cannot create/edit content, listings hidden
- **cancelled**: Account cancelled by user

## Automated Trial Expiration

### Edge Function: check-expired-trials

This function should be run daily (via cron or scheduled task) to:
- Find all trial accounts where trial_end_date has passed
- Update account_status to `suspended`
- Hide all books, series, and collections from suspended authors
- Preserve all data for potential reactivation

**To run manually:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/check-expired-trials \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Recommended: Set up a cron job or use a service like:**
- GitHub Actions scheduled workflow
- Vercel Cron
- EasyCron
- Or any cron service that can make HTTP requests

## Account Reactivation

When a suspended user subscribes via Stripe:
1. Stripe webhook receives payment confirmation
2. System automatically calls `reactivate_account()` function
3. Account status updated to `active`
4. All books, series, and collections reactivated
5. User regains full access immediately

## User Experience

### During Trial
- Trial countdown banner displayed on dashboard
- Badge shows "Trial (X days left)"
- Warning becomes urgent when 3 or fewer days remain
- Full access to all features

### After Trial Expires
- Redirected to subscription required page
- Cannot access dashboard or create content
- All listings hidden from public view
- Data preserved for reactivation
- Can subscribe to reactivate immediately

## Database Functions

### get_trial_days_remaining(author_id)
Returns number of days remaining in trial, or NULL if not on trial.

### suspend_expired_trials()
Finds and suspends all expired trial accounts, returns count and affected IDs.

### reactivate_account(author_id)
Reactivates a suspended account and restores all content visibility.

## Row Level Security

RLS policies enforce account status restrictions:
- **Suspended users**: Cannot INSERT, UPDATE, or DELETE content
- **Trial users**: Full access to their own content
- **Active users**: Full access to their own content
- **All users**: Can view their own content (for dashboard access)

## Testing the System

### Test Trial Flow
1. Sign up without a GP code
2. Check account_status is `trial` in database
3. Verify trial_end_date is set to 14 days from now
4. See trial banner on dashboard
5. Manually update trial_end_date to past date
6. Run check-expired-trials function
7. Verify account is suspended and content is hidden

### Test GP Author Flow
1. Sign up with valid GP author code
2. Check account_status is `active` in database
3. Verify no trial dates are set
4. Confirm no trial banner appears
5. Verify full access with no restrictions

### Test Reactivation Flow
1. Suspend an account manually (or let trial expire)
2. Process a successful Stripe subscription payment
3. Verify account is reactivated
4. Confirm all content is visible again
5. Check user can access dashboard

## Admin Management

Super admins can:
- Create and manage GP author codes in the dashboard
- View all author accounts and their statuses
- Override account restrictions (super admins bypass all RLS checks)

## Important Notes

- Trial dates are stored in UTC timezone
- Day calculation rounds up (partial days count as full days)
- GP authors and admins never have trials
- Account suspension hides content but does not delete it
- Stripe webhook handles reactivation automatically
- Edge function must be scheduled to run daily for automation
