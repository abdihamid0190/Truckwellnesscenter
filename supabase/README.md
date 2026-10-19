# Driver posts backend (Supabase)

Parking votes, tips, reports and blocks are stored in Supabase. The app works without it (driver posts show as "coming soon") until the two keys below are set.

## One-time setup

1. Create a free project at https://supabase.com/dashboard.
2. Open **SQL Editor**, paste all of `migrations/0001_driver_posts.sql`, and run it.
3. Sign-in uses a 6-digit email code, not a link. Go to **Authentication > Emails > Magic Link** and replace `{{ .ConfirmationURL }}` in the template with `{{ .Token }}`, for example: `Your Trucker Wellness code is {{ .Token }}`.
4. Go to **Project Settings > API Keys** and copy the project URL and the **publishable** key. Never put the secret key in the app.
5. Put them in `.env` at the root of the repo. That file is committed, so local runs and EAS builds both pick them up. To try a different project locally, override them in `.env.local` (see `.env.example`).

Supabase's built-in email sender only sends a few emails an hour. That's fine for testing; before real drivers use the app, connect your own email sender under **Authentication > Emails > SMTP Settings**.

## Moderation

- A tip is hidden for everyone once three drivers report it. Review hidden tips in **Table Editor > tips** (filter `hidden = true`), and delete the tip or set `hidden` back to false.
- To remove a driver who breaks the rules, delete their user under **Authentication > Users**. Their profile, votes and tips are deleted with them.
