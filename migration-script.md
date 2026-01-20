# Data Migration Script for Multi-Author Platform

This script migrates all existing data to be owned by a super admin author account.

## Prerequisites

1. You must already have a super admin account created
2. You need the super admin's UUID (from the authors table)

## Step 1: Create Super Admin Account

If you haven't already, create a super admin account by:

1. Register at `/register` with the Grendel Press code
2. Get the user ID from Supabase Auth dashboard
3. Update the authors record:

```sql
UPDATE authors
SET
  is_super_admin = true,
  is_grendel_press = true,
  subscription_status = 'free',
  is_approved = true
WHERE id = 'YOUR_USER_ID_HERE';
```

## Step 2: Migrate Existing Data

Replace `YOUR_SUPER_ADMIN_ID` with your actual super admin UUID in the following SQL commands:

```sql
-- Update all books to belong to super admin
UPDATE books
SET author_id = 'YOUR_SUPER_ADMIN_ID'
WHERE author_id IS NULL;

-- Update all series to belong to super admin
UPDATE series
SET author_id = 'YOUR_SUPER_ADMIN_ID'
WHERE author_id IS NULL;

-- Update all collections to belong to super admin
UPDATE collections
SET author_id = 'YOUR_SUPER_ADMIN_ID'
WHERE author_id IS NULL;

-- Update all book_passwords to belong to super admin
UPDATE book_passwords
SET author_id = 'YOUR_SUPER_ADMIN_ID'
WHERE author_id IS NULL;
```

## Step 3: Migrate Storage Files

Currently, files in storage are at the root level. They need to be moved to author-specific folders.

### For master_pdfs bucket:

1. List all files in the bucket
2. For each file, copy to `YOUR_SUPER_ADMIN_ID/{filename}`
3. Delete the original files

### For cover_images bucket:

1. List all files in the bucket
2. For each file, copy to `YOUR_SUPER_ADMIN_ID/{filename}`
3. Delete the original files

### Update database references:

```sql
-- Update books storage_key to include author folder
UPDATE books
SET storage_key = CONCAT('YOUR_SUPER_ADMIN_ID/', storage_key)
WHERE author_id = 'YOUR_SUPER_ADMIN_ID'
AND storage_key NOT LIKE 'YOUR_SUPER_ADMIN_ID/%';

-- Update books epub_storage_key to include author folder
UPDATE books
SET epub_storage_key = CONCAT('YOUR_SUPER_ADMIN_ID/', epub_storage_key)
WHERE author_id = 'YOUR_SUPER_ADMIN_ID'
AND epub_storage_key IS NOT NULL
AND epub_storage_key NOT LIKE 'YOUR_SUPER_ADMIN_ID/%';

-- Update books cover_image_key to include author folder
UPDATE books
SET cover_image_key = CONCAT('YOUR_SUPER_ADMIN_ID/', cover_image_key)
WHERE author_id = 'YOUR_SUPER_ADMIN_ID'
AND cover_image_key IS NOT NULL
AND cover_image_key NOT LIKE 'YOUR_SUPER_ADMIN_ID/%';

-- Update series cover_image_key to include author folder
UPDATE series
SET cover_image_key = CONCAT('YOUR_SUPER_ADMIN_ID/', cover_image_key)
WHERE author_id = 'YOUR_SUPER_ADMIN_ID'
AND cover_image_key IS NOT NULL
AND cover_image_key NOT LIKE 'YOUR_SUPER_ADMIN_ID/%';

-- Update collections cover_image_key to include author folder
UPDATE collections
SET cover_image_key = CONCAT('YOUR_SUPER_ADMIN_ID/', cover_image_key)
WHERE author_id = 'YOUR_SUPER_ADMIN_ID'
AND cover_image_key IS NOT NULL
AND cover_image_key NOT LIKE 'YOUR_SUPER_ADMIN_ID/%';
```

## Step 4: Verification

Run these queries to verify the migration:

```sql
-- Check that all books have an author
SELECT COUNT(*) FROM books WHERE author_id IS NULL;
-- Should return 0

-- Check that all series have an author
SELECT COUNT(*) FROM series WHERE author_id IS NULL;
-- Should return 0

-- Check that all collections have an author
SELECT COUNT(*) FROM collections WHERE author_id IS NULL;
-- Should return 0

-- Check that all passwords have an author
SELECT COUNT(*) FROM book_passwords WHERE author_id IS NULL;
-- Should return 0

-- Verify super admin exists
SELECT * FROM authors WHERE is_super_admin = true;
-- Should return your super admin record
```

## Step 5: Test

1. Log in as the super admin at `/login`
2. Navigate to `/dashboard`
3. Verify you can see all books, series, collections, passwords, and exports
4. Try creating a new book to verify the system works correctly

## Notes

- Signups and downloads tables don't need migration as they're linked via book_id
- The migration is safe to run multiple times (idempotent)
- Make a backup of your database before running the migration
- Storage file migration must be done carefully to avoid data loss
