# Database Migrations

## Adding the `is_active` Column

To enable teacher account activation/deactivation, you need to add the `is_active` column to your `users` table.

### Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** (in the left sidebar)

2. **Run the Migration SQL**
   - Copy and paste the SQL from `add_is_active_column.sql`
   - Or run this SQL directly:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE users SET is_active = true WHERE is_active IS NULL;
```

3. **Verify the Column**
   - Go to **Table Editor** > `users` table
   - You should see the `is_active` column with a default value of `true`

### What This Does:

- Adds an `is_active` boolean column to the `users` table
- Sets default value to `true` (all existing users will be active)
- Updates any NULL values to `true` for existing records

### After Running the Migration:

Once you've run the SQL, refresh your admin panel and try activating/deactivating a teacher account again. The feature should work correctly.

