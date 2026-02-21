# Supabase Database Setup Guide

## How to Get Your Supabase `DATABASE_URL`

### Step-by-step

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)** and sign in
2. Select your project (or create a new one)
3. Navigate to: **Settings** → **Database** (left sidebar)
4. Scroll to **Connection string** section
5. Select the **URI** tab
6. Copy the connection string — it looks like:

```
postgresql://postgres.[your-project-ref]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

---

## Where to Paste It

Set it in your `.env` file (create one from `.env.example`):

```bash
# c:\Users\Administrator\Downloads\New\E_Com\.env
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:YourPassword@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

When `DATABASE_URL` is set, the app **automatically** uses Supabase instead of local PostgreSQL — no other changes needed.

---

## Relevant Config Files

| File | Purpose |
|------|---------|
| `.env.example` | Template with `DATABASE_URL` field |
| `backend/src/config/database.js` | Auto-detects Supabase vs local, enables SSL |
| `backend/src/config/env.js` | Validates the env var |

---

> **Tip:** Use port **6543** (connection pooler / transaction mode) for better performance, not **5432** (direct connection).
