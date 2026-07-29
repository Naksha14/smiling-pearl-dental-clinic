# Smiling Pearl Dental Clinic Web App

Stack:
- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL + RLS + Realtime
- Puter.js TTS
- OpenRouter server-side assistant

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Run `supabase/policies.sql`.
4. Create two Auth users in Supabase Authentication. Do not put passwords in SQL or source code.
5. For each Auth user, insert/update a row in `profiles` with `username` and role (`doctor` or `receptionist`).
6. Copy `.env.example` to `.env.local` and fill in Supabase values.
7. Add an OpenRouter API key and model if you want the doctor assistant.
8. Run:
   npm install
   npm run dev
9. Open http://localhost:3000

The login form accepts a clinic username and password. It resolves the username to the email stored in `profiles`, then signs in with Supabase Auth.

Important:
- The supplied medication list is NOT hard-coded into this starter. The `medicines` table is clinician-managed.
- The app is a software foundation, not a clinical decision-making system.
- Patient voice announcements use browser TTS via Puter.js; they are not telephone calls.
