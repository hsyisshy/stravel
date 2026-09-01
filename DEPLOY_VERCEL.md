# Vercel Deployment Guide

## 1. Prepare Supabase
1. Open Supabase SQL Editor.
2. Run [supabase/schema.sql](supabase/schema.sql).
3. Confirm bucket `group-photos` exists in Storage.

## 2. Local environment
Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

## 3. Push to Git repository
Commit and push current project to GitHub/GitLab/Bitbucket.

## 4. Import to Vercel
1. Go to Vercel dashboard and import the repository.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.

## 5. Set environment variables on Vercel
Add these variables in Project Settings -> Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use values from `.env.example` (or your own Supabase project keys).

## 6. Deploy
Click Deploy. After deployment, test routes:

- `/admin/groups`
- `/admin/groups/new`
- `/admin/groups/:groupId?token=xxxxx`
- `/group/:groupId`
- `/group/:groupId/join`

## Notes
- This MVP currently relies on anon key without login.
- For production-hardening, add stricter RLS and server-side token verification.
