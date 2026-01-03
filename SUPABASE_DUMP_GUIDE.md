# How to Dump/Backup Supabase Database

This guide covers multiple methods to backup your Supabase PostgreSQL database.

## Method 1: Using pg_dump (Recommended)

`pg_dump` is the standard PostgreSQL tool for creating database backups.

### Prerequisites
- PostgreSQL client tools installed (includes `pg_dump`)
- Your Supabase database connection details

### Steps

1. **Get your database connection string from Supabase:**
   - Go to your Supabase Dashboard
   - Navigate to **Settings** → **Database**
   - Find the **Connection string** section
   - Copy the **URI** or **Connection pooling** string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - **Note:** The format is `postgres:` (not `postgres.[PROJECT-REF]:`). The PROJECT-REF only appears in the hostname.

2. **Create a dump file:**
   ```bash
   pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" > supabase_dump.sql
   ```

   Or using environment variables for security:
   ```bash
   export PGPASSWORD='your-password'
   pg_dump -h db.[PROJECT-REF].supabase.co -U postgres -d postgres > supabase_dump.sql
   ```

3. **For custom format (compressed, easier to restore):**
   ```bash
   pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -Fc > supabase_dump.dump
   ```

4. **Include only schema (no data):**
   ```bash
   pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" --schema-only > schema_only.sql
   ```

5. **Include only data (no schema):**
   ```bash
   pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" --data-only > data_only.sql
   ```

### Options
- `-Fc` or `--format=custom`: Creates a compressed, custom-format dump (best for large databases)
- `--schema-only`: Dump only the schema (structure), no data
- `--data-only`: Dump only the data, no schema
- `-t table_name`: Dump only a specific table
- `-n schema_name`: Dump only a specific schema
- `--no-owner`: Don't output commands to set ownership of objects
- `--no-privileges`: Don't output commands to set privileges

---

## Method 2: Using Supabase CLI

If you have the Supabase CLI installed, you can use it to dump your database.

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Authenticated with Supabase: `supabase login`

### Steps

1. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Create a dump:**
   ```bash
   supabase db dump -f supabase_dump.sql
   ```

3. **Dump with data:**
   ```bash
   supabase db dump --data-only -f data_only.sql
   ```

4. **Dump schema only:**
   ```bash
   supabase db dump --schema-only -f schema_only.sql
   ```

---

## Method 3: Using Supabase Dashboard (Limited)

The Supabase Dashboard has limited export capabilities:

1. Go to **Table Editor** in your Supabase Dashboard
2. Select a table
3. Click **Export** (exports to CSV/JSON)
4. Repeat for each table (manual process)

**Note:** This method exports data only, not schema, and is manual for each table.

---

## Method 4: Using SQL Editor (Full Schema Export)

You can export your schema using SQL:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query to generate CREATE statements for all tables:
   ```sql
   SELECT 
     'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || 
     string_agg(column_name || ' ' || data_type || 
       CASE 
         WHEN character_maximum_length IS NOT NULL 
         THEN '(' || character_maximum_length || ')'
         ELSE ''
       END ||
       CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, 
       ', '
     ) || ');'
   FROM information_schema.columns
   WHERE table_schema = 'public'
   GROUP BY schemaname, tablename;
   ```

**Note:** This is more complex and doesn't include indexes, constraints, triggers, etc.

---

## Method 5: Using Docker (if pg_dump not installed)

If you don't have PostgreSQL tools installed, you can use Docker:

```bash
docker run --rm -e PGPASSWORD=your-password postgres:15 pg_dump -h db.your-project-ref.supabase.co -U postgres -d postgres > supabase_dump.sql
```

---

## Recommended Approach

For a complete backup, use **Method 1 (pg_dump)** with custom format:

```bash
# Full backup (compressed)
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -Fc \
  --no-owner \
  --no-privileges \
  > supabase_backup_$(date +%Y%m%d_%H%M%S).dump

# Plain SQL backup (readable)
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  --no-owner \
  --no-privileges \
  > supabase_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from dump:

**From plain SQL:**
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" < supabase_dump.sql
```

**From custom format:**
```bash
pg_restore -d "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" supabase_dump.dump
```

---

## Security Notes

- **Never commit passwords to version control**
- Use environment variables or `.env` files (add to `.gitignore`)
- Use connection pooling strings when available
- Consider using Supabase's connection pooling for better performance

---

## Finding Your Connection Details

1. Go to Supabase Dashboard → Your Project
2. Settings → Database
3. Connection string section
4. Copy the connection string (URI format)
5. Replace `[YOUR-PASSWORD]` with your database password
6. Replace `[PROJECT-REF]` with your project reference ID

---

## Troubleshooting

### "pg_dump: error: connection to server failed"
- Check your password is correct
- Verify the project reference ID
- Check if your IP is allowed (Supabase Dashboard → Settings → Database → Connection pooling)

### "role does not exist" or permission errors
- Make sure you're using the `postgres` user
- Check your database password in Supabase Dashboard → Settings → Database

### Large database timeout
- Use connection pooling string
- Use custom format (`-Fc`) for faster dumps
- Dump in smaller chunks using `-t` for specific tables
