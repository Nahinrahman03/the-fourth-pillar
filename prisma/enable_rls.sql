-- ============================================================
-- Enable Row Level Security (RLS) on all public tables
-- Run this in Supabase SQL Editor
--
-- WHY: Supabase exposes all tables via PostgREST (REST API).
-- Without RLS, anyone with the anon/public key can read/write
-- all data. Enabling RLS blocks direct API access while keeping
-- Prisma (which connects as postgres superuser) fully functional.
-- ============================================================

-- Core Auth Tables (NextAuth)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- App Tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsFlag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SignInCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuthSession" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Optional: Verify RLS is enabled on all tables
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
