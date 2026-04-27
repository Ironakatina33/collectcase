# Mythara

> Creature collecting web game with case opening, PvE/PvP combat, trading, and market economy.

Mythara is a free-to-play browser game built with `Next.js` + `Supabase`.  
The project focuses on a smooth progression loop: open cases, grow your collection, battle, trade, and climb the leaderboard.

---

## Highlights

- Account system (`register` / `login`) with Supabase Auth
- Case opening with rarity odds and mythic pity system
- Collection management with filters and bulk sell
- PvE and PvP battle simulation with detailed logs
- Player marketplace (list, buy, cancel)
- Direct player trades (create, accept, decline, cancel)
- Leaderboard + profile stats + daily reward

---

## Tech Stack

- `Next.js 14` (App Router)
- `TypeScript`
- `Tailwind CSS`
- `Supabase` (PostgreSQL, Auth, RLS, RPC)
- `Vercel` (deployment)

---

## Project Structure

```txt
app/
  (auth)/
  api/
  play/
components/
  game/
  layout/
  ui/
lib/
  game/
  supabase/
supabase/
  schema.sql
```

---

## Quick Start (Local)

### 1) Install

```bash
npm install
```

### 2) Env vars

Create `.env.local` at project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3) Prepare database

- Open Supabase SQL Editor
- Run `supabase/schema.sql`

### 4) Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Deploy on Vercel (Free)

1. Push project to GitHub
2. Import repository in Vercel
3. Add the 3 env vars in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

For Supabase Auth URL settings:

- `Site URL`: your Vercel domain (`https://your-app.vercel.app`)
- `Redirect URLs`: same domain (and custom domain if used)

---

## Scripts

- `npm run dev` → start dev server
- `npm run build` → production build
- `npm run start` → run production build locally
- `npm run lint` → lint check

---

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- Rotate leaked keys immediately in Supabase dashboard
- Keep secrets in `.env.local` (local) and Vercel env settings (cloud)

---

## Gameplay Notes

- Mythara is an original universe and creature roster
- Case opening is fictional in-game economy (no real-money gambling integration)
- Drop rates and progression can be tuned directly in `lib/game/cases.ts`

---

## Build Status

Current production build command:

```bash
npx --no-install next build
```

Build completes successfully.

---

## Roadmap Ideas

- Seasonal events and limited-time cases
- Ranked PvP matchmaking
- Guilds / teams
- Cosmetic skins and profile banners
- Quest system and battle pass