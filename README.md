# Co-op Apartment Decorator

A mobile-first realtime decorating prototype modeled after the uploaded apartment floor plan. It uses React, Vite, TypeScript, Konva, and Supabase.

## Features

- Clean top-down redrawn apartment plan based on the measured image
- Touch-friendly canvas with drag, pan, wheel zoom, pinch zoom, and fit controls
- Name picker for Jordan, Camila, and Ari
- Supabase presence with live names near cursor or touch position
- Realtime furniture insert, update, and delete sync
- Autosave plus a visible Save button
- Local-only fallback when Supabase env vars are missing
- Small ambient decorative avatars for Jordan, Camila, and Ari
- GitHub Pages deployment config

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

The app runs locally without Supabase by saving furniture in `localStorage`. Realtime co-op turns on after adding Supabase environment variables.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run [`supabase/schema.sql`](supabase/schema.sql).
4. In Project Settings, copy the project URL and anon public key.
5. Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BASE_PATH=/
```

The SQL creates:

- `public.furniture_items`
- permissive anon Row Level Security policies for this private toy app
- realtime publication membership for `furniture_items`

Presence uses the Supabase realtime channel `apartment-presence`; it does not need a table.

## Data Model

`furniture_items`

- `id uuid primary key`
- `type text`
- `x numeric`
- `y numeric`
- `rotation numeric`
- `width numeric`
- `height numeric`
- `created_by text`
- `updated_at timestamptz`

## GitHub Pages Deployment

This repo includes `.github/workflows/deploy.yml` and `gh-pages` scripts.

For GitHub Actions:

1. Add repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Confirm the workflow `VITE_BASE_PATH` matches the repository path. For `https://USER.github.io/Apartment/`, use:

```bash
VITE_BASE_PATH=/Apartment/
```

3. Push to `main`.
4. In GitHub repository settings, enable Pages with GitHub Actions as the source.

For manual deployment:

```bash
npm run deploy
```

If you deploy to a custom domain or root `github.io` site, set `VITE_BASE_PATH=/`.

## Project Structure

```text
src/
  components/
    ApartmentCanvas.tsx
    FurniturePalette.tsx
    NameGate.tsx
  data/
    floorPlan.ts
    furniture.ts
  hooks/
    useFurnitureSync.ts
    usePresence.ts
  lib/
    supabase.ts
supabase/
  schema.sql
```

## Notes

The floor plan uses the visible measurements from the apartment image as practical scale anchors:

- Bedroom: about 17' x 11'
- Living room: about 19' x 14'
- Secondary bedroom / Ari room: about 14' x 10'
- Dining/kitchen area: about 9' x 8'

The app intentionally avoids auth for the MVP. Treat the link and anon key as private-to-friends, not secure access control.
