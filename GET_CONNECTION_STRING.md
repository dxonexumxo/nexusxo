# How to Get Your Supabase Database Connection String

## Step 1: Get Your Project Reference

Your **PROJECT-REF** is part of your Supabase URL. You can find it in one of these ways:

### Option A: From Your Environment Variable
Your `NEXT_PUBLIC_SUPABASE_URL` looks like this:
```
https://[PROJECT-REF].supabase.co
```

For example, if your URL is:
```
https://tnavqjdjenvqpjwpwfzv.supabase.co
```
Then your PROJECT-REF is: `tnavqjdjenvqpjwpwfzv`

### Option B: From Supabase Dashboard
1. Go to your Supabase Dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Find **Reference ID** - this is your PROJECT-REF

## Step 2: Get Your Database Password

1. Go to Supabase Dashboard → Your Project
2. Navigate to **Settings** → **Database**
3. Scroll to **Database password**
4. Click **Reset database password** if you don't remember it
5. Copy the password (you'll only see it once, so save it securely!)

## Step 3: Construct the Connection String

### ✅ CORRECT FORMAT:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### ❌ WRONG FORMAT (what you had):
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Key differences:**
- Use `postgres:` (not `postgres.[PROJECT-REF]:`)
- Password goes after `postgres:`
- Project reference only appears in the hostname: `db.[PROJECT-REF].supabase.co`

## Step 4: Example with Real Values

If your:
- PROJECT-REF is: `tnavqjdjenvqpjwpwfzv`
- Database password is: `MySecurePassword123!`

Then your connection string would be:
```
postgresql://postgres:MySecurePassword123!@db.tnavqjdjenvqpjwpwfzv.supabase.co:5432/postgres
```

## Step 5: Use the Connection String

### For pg_dump:
```bash
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" > backup.sql
```

### For PowerShell (Windows):
```powershell
$env:PGPASSWORD="[YOUR-PASSWORD]"
pg_dump -h db.[PROJECT-REF].supabase.co -U postgres -d postgres > backup.sql
```

## Quick Reference Template

Replace the values in brackets:
```
postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

Where:
- `[YOUR-DATABASE-PASSWORD]` = Your database password from Settings → Database
- `[YOUR-PROJECT-REF]` = Your project reference ID (from your Supabase URL or Settings → General)
