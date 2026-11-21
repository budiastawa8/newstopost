# NewsToPost

Ubah URL berita jadi:

1. **News → Carousel** — ringkas Gemini, preview slide, unduh ZIP PNG (Instagram/Facebook)
2. **News → Motion Graphic** — brief VO + karaoke, render MP4 lokal via Remotion (tanpa CapCut)

## Stack

- Next.js (App Router) + Tailwind + shadcn/ui
- Gemini API (ringkasan + caption/hashtag + motion brief)
- html-to-image + JSZip (export PNG carousel)
- Remotion + edge-tts (render video lokal di `remotion-news/`)
- Password bersama (middleware) agar hanya tim yang bisa akses

## Lokal

```bash
cp .env.example .env.local
# isi GEMINI_API_KEY=...
# opsional: APP_PASSWORD=rahasia-tim  (tanpa ini, lokal tetap terbuka)
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

| Variabel | Wajib | Keterangan |
|---|---|---|
| `GEMINI_API_KEY` | Ya | API key Google AI Studio |
| `APP_PASSWORD` | Ya di Vercel | Password bersama tim; tanpa ini production dikunci |
| `GEMINI_MODEL` | Tidak | Override model (disarankan `gemini-3.5-flash-lite` di Vercel) |
| `APP_AUTH_SECRET` | Tidak | Secret cookie (default = `APP_PASSWORD`) |

## News → Motion Graphic

1. Pilih tab **News → Motion Graphic**
2. Tempel URL (atau teks berita) → **Generate Motion Brief**
3. **Unduh brief untuk Claude** (disarankan) → unggah ke Claude + naskah `voText` (dari Gemini) di ElevenLabs + foto dari `images` / `imageUrl`
4. Opsional Remotion lokal: **Unduh brief Remotion** lalu:

```powershell
cd G:\BUDIAST\newstopost\remotion-news
npm install
py -3 -m pip install edge-tts
.\render.ps1 -Brief C:\Users\BUDIAST\Downloads\news-brief-....json
```

Hasil Remotion: `remotion-news\out\news-motion.mp4`

Brief Claude berisi `voText`, `onScreen` per beat, URL foto, dan `production.promptHint` (tanpa `wordTimings` Remotion). Render video **tidak** jalan di Vercel — hanya generate brief.

## PWA

App ini installable (standalone) lewat browser:
- Manifest: `app/manifest.ts`
- Service worker: Serwist (`/serwist/sw.js`) — aktif di production
- Offline fallback: `/~offline` (Generate tetap butuh internet)

Di Android Chrome: menu → **Install app** / **Add to Home screen**.  
Di iPhone Safari: Share → **Add to Home Screen**.

## Deploy ke Vercel

1. Push repo ini ke GitHub (branch `main`).
2. Di [vercel.com/new](https://vercel.com/new): **Import** repo → Framework **Next.js** (otomatis).
3. **Environment Variables** (Production + Preview):
   - `GEMINI_API_KEY` = key Anda
   - `APP_PASSWORD` = password yang hanya diketahui tim
   - disarankan `GEMINI_MODEL` = `gemini-3.5-flash-lite`
4. Deploy. Buka situs → halaman **Login** → masuk dengan password → Generate.
5. Sesi berlaku 14 hari (cookie httpOnly). Tombol **Keluar** di header menghapus sesi.

Jangan commit `.env.local`. File itu sudah di-ignore.

## Scripts

```bash
npm run dev    # development
npm run build  # production build
npm run start  # jalankan hasil build
npm run lint
```
