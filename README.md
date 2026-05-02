# News Brief Hub

A moderated news web app where visitors can read short headline-based updates and signed-in users can submit news for review.

## Core capabilities

- Public homepage with only headlines and 2-5 short bullet points.
- Sign-in with email or phone-based one-time code.
- Private user profile with points.
- Contributor portal for submitting news.
- Admin review queue that approves or rejects submissions before publication.
- In-app notifications for signed-in users.
- Rate limiting on sensitive flows.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL (Supabase)
- Firebase Auth
- Zod

## Quick start

1. Copy `.env.example` to `.env`.
2. Fill in the required environment variables:
   - **Supabase**: `DATABASE_URL` and `DIRECT_URL`.
   - **Firebase**: `NEXT_PUBLIC_FIREBASE_*` variables.
   - **NextAuth**: `NEXTAUTH_SECRET`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
5. Seed initial data:
   ```bash
   npm run db:seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## Auth delivery notes

This project supports email and phone sign-in by one-time code.

- In local development, generated codes are logged to the server console.
- SMTP and SMS provider variables are included in `.env.example` as future integration points.
- The delivery stub lives in `src/lib/delivery.ts`.

## Admin moderation

Any email listed in `ADMIN_EMAILS` is promoted to admin the first time it signs in, and the seed script also provisions the first listed admin email.
