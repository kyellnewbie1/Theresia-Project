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

## Update: cookie sessions, profile, appearance, admin

1. Run `supabase/security-update.sql` in Supabase SQL Editor after the original schema. This fixes the profile update policy and blocks self-editing `is_owner`, `is_verified`, and `role_label`.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server-only `SUPABASE_SERVICE_ROLE_KEY` in Vercel. Never use the service-role key in a `NEXT_PUBLIC_*` variable.
3. `middleware.ts` refreshes the Supabase SSR session and persists auth tokens in Supabase cookies. Cookie-based sessions help support server verification but do not make account theft impossible; keep HTTPS enabled, do not share secrets, and protect the GitHub account with MFA.
4. Admin endpoints re-check the authenticated user and `profiles.is_owner` on the server for each request. The Admin Panel supports user lookup, verification toggles, owner status management, site notice, and global character video URL.
5. `/settings/profile` lets a signed-in user edit username, display name, avatar URL, and bio. `/settings/appearance` saves theme/background preferences in the current browser only. Video background URLs must be direct public HTTPS media links (prefer MP4/WebM); video backgrounds loop when autoplay is allowed.

### Important deployment note
After applying SQL and setting Vercel environment variables, redeploy the site. Create `public/verify.png` yourself for the verification icon. Features that need additional dedicated backend flows (for example password-protected files and full follow/notification workflows) are not represented as complete merely because a link or schema table exists.


## Update: pagination, verified badge, file metrics

1. Run `supabase/metrics-pagination-update.sql` in Supabase SQL Editor after the initial schema. This adds view/download counters and service-role-only RPC functions.
2. Keep `SUPABASE_SERVICE_ROLE_KEY` configured only as a server-side Vercel environment variable. Never expose it as `NEXT_PUBLIC_*`.
3. Explore now paginates public files (8 per page); file details show views and downloads. A view is counted once per browser session per file. Downloads count when an authorized signed download URL is issued.
4. The profile verified mark is rendered with an inline icon, so it sits beside the display name and does not depend on a missing `public/verify.png` asset.
5. Page metadata now uses the Theresia title template. Upload already supports a custom title and description per file.


## Owner tools: verification and custom roles (v5)

Open `/admin` while signed in as an owner. In the user list, use **Verifikasi/Cabut centang** to manage the verified badge and the **Role custom** field plus **Simpan role** to set a public role label (for example `Moderator`, `Creator`, or `VIP`). These actions are processed by the server route and require `SUPABASE_SERVICE_ROLE_KEY` configured as a server-only Vercel environment variable. The role label is a display label, not an authorization grant; owner access is still controlled separately by `is_owner`.

Verified badges use the same Lucide `BadgeCheck` icon with a blue fill and white check across dashboard, profile, user search, file detail, and admin list. No `public/verify.png` asset is required.


## Announcement popup and per-browser background update

1. Run `supabase/announcement-background-update.sql` in Supabase SQL Editor after the existing schema/security migrations if the `site_notice` setting does not already exist.
2. Deploy the project.
3. As Owner, open Admin Panel to set, replace, or clear the announcement popup. The Owner panel also keeps the separate global character-video setting.
4. Each user configures their own image or video background in `/settings/appearance`. Preferences are stored in that browser's localStorage, so different browsers/devices can have different backgrounds. Owner settings do not override user backgrounds.
5. Video backgrounds use a public direct HTTPS MP4/WebM URL and loop automatically when the browser allows muted autoplay. Some hosts block direct media access, and some browsers may require user interaction before playback.
