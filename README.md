# Theresia Project

Mobile-first Next.js + TypeScript starter for a public code/file-sharing site. Built around GitHub OAuth, Supabase Postgres and Supabase Storage, and deployment to GitHub + Vercel.

## Features included in this starter

- Minimal dark landing page and responsive hamburger menu.
- GitHub OAuth sign-in using Supabase.
- Profile page with a `public/verify.png` verification icon (you provide the image).
- Explore public file metadata, upload files up to 20 MB, and signed download URLs.
- Visibility labels: public/private/password. **Password-protected access is only a placeholder and must not be used until a server-verified password flow is implemented.**
- Browser-only appearance preference storage.
- Initial owner panel shell; sensitive administrative actions are not exposed as client-side mutations.
- SQL schema, RLS policies, storage policies, default profile trigger, follows and role-request tables.

## Requirements

- Node.js 20.9+ recommended
- GitHub account
- Supabase project
- GitHub repository and Vercel account

## Local setup

1. Extract the ZIP and open this folder in a terminal.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and anon/publishable key.
4. In Supabase Dashboard → SQL Editor, run `supabase/schema.sql`.
5. In Supabase Authentication → Providers, enable GitHub. Create a GitHub OAuth App and enter its client ID/secret in Supabase. Configure the callback URL shown by Supabase and add your local/deployed site URL to Supabase Auth URL Configuration.
6. After first login, open Supabase → Authentication → Users, copy your user UUID, and run the owner setup SQL at the bottom of `supabase/schema.sql` with that UUID. Do not use a username-only owner check.
7. Add your own blue-check icon at `public/verify.png`.
8. Run `npm run dev` and open the local URL printed by Next.js.

## Deploy with GitHub + Vercel

1. Create a GitHub repository and upload/push this project.
2. Import that repository in Vercel.
3. In Vercel Project → Settings → Environment Variables, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` for Preview and Production.
4. Deploy. Add your production URL to Supabase Auth URL Configuration and the GitHub OAuth app callback settings as needed.

## Important security notes

- Never put the Supabase `service_role` secret in a `NEXT_PUBLIC_*` variable or browser code.
- RLS is essential; review policies before production. The starter intentionally does not include admin mutations, password-protected file unlock, report moderation, or full follower controls yet.
- Public file storage is private by default. Public and owner-authorized downloads are issued by a server route that checks metadata/ownership before using the server-only service role to create a short-lived signed URL. Keep `SUPABASE_SERVICE_ROLE_KEY` secret and never expose it to browser code.
- The starter does not execute uploaded code or ZIPs on the server.
- The SQL trigger creates profile usernames with a suffix to avoid collisions. Users can later add a profile-edit flow with server-validated username changes.
- `public/verify.png` is just an image; the trusted `is_verified` database flag decides whether it appears.

## Routes

- `/` landing page
- `/login` GitHub OAuth
- `/explore` public file metadata
- `/dashboard` dashboard
- `/upload` file upload
- `/file/[id]` file details
- `/u/[username]` public profile
- `/settings/appearance` browser-only appearance preferences
- `/admin` owner panel shell

## Current limitations

This is a usable project foundation, not a complete production launch. Before inviting public users, finish server-side storage authorization for public downloads, implement a proper password-protected-file flow, add middleware/server-side owner verification for every admin action, and test Supabase RLS with anonymous and authenticated accounts.
