# 🏋️ Workout Tracker

A personal, offline-first PWA for tracking lifting workouts — log sets (load in kg
+ reps) per exercise, reuse previous workouts as editable drafts, get Google-style
exercise autocomplete, and chart your progress (per-exercise load & volume, total
workout volume, weekly volume).

Everything runs **on-device**: data lives in the browser's IndexedDB, the app works
fully offline, and it installs to your iPhone home screen via Safari → *Add to Home
Screen*. No account, no server, no App Store.

## Tech

- **Vite + React + TypeScript**
- **Dexie.js** over IndexedDB (+ `dexie-react-hooks` `useLiveQuery` for reactive data)
- **Recharts** for graphs
- **vite-plugin-pwa** (Workbox) for the service worker, manifest & offline support
- **HashRouter** so deep links work on any static host

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
```

To regenerate the app icons (procedurally drawn dumbbell):

```bash
npm run icons
```

## Build & preview the production app (includes the service worker)

```bash
npm run build
npm run preview      # serves dist/ with the PWA service worker active
```

## Use it on your iPhone

The service worker requires **HTTPS** (localhost is exempt, a LAN IP is not), so:

1. Deploy `dist/` to any free static host with HTTPS — Cloudflare Pages, Netlify,
   Vercel, or GitHub Pages (all work from Linux). It's a plain static site.
   - For quick LAN testing without deploying, expose the dev server over HTTPS with a
     tunnel: `cloudflared tunnel --url http://localhost:5173` (or ngrok).
2. Open the URL in **iPhone Safari** → Share → **Add to Home Screen**.
3. Launch it from the home screen: it runs fullscreen and works offline.
4. In **Settings → Storage**, tap *Enable persistent storage* to reduce the chance
   iOS evicts your data, and **export a backup** periodically (Settings → Backup).

## Data model

`exercises` → `workouts` (sessions) → `workoutExercises` → `sets` (weightKg + reps).
Volume metrics (set/exercise/workout/weekly) are computed, never stored. See
`src/db/`.

## Backup

Your history lives only on the installed device. Settings → **Export backup** writes a
JSON file; **Import backup** restores it (replacing current data). This is your safety
net and how you'd move data to another device.
