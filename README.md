# NewsToPost

Ubah URL berita jadi carousel Instagram/Facebook: scrape artikel, ringkas dengan Gemini, preview slide, unduh ZIP PNG.

## Stack

- Next.js (App Router) + Tailwind + shadcn/ui
- Gemini API (ringkasan + caption/hashtag)
- html-to-image + JSZip (export PNG)

## Lokal

```bash
cp .env.example .env.local
# isi GEMINI_API_KEY=...
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

| Variabel | Wajib | Keterangan |
|---|---|---|
| `GEMINI_API_KEY` | Ya | API key Google AI Studio |
| `GEMINI_MODEL` | Tidak | Override model utama (default `gemini-3.8-flash`, ada fallback otomatis) |

## Deploy ke Vercel

1. Push repo ini ke GitHub (branch `main`).
2. Di [vercel.com/new](https://vercel.com/new): **Import** repo → Framework **Next.js** (otomatis).
3. **Environment Variables** (Production + Preview):
   - `GEMINI_API_KEY` = key Anda
   - opsional `GEMINI_MODEL` = `gemini-3.6-flash` jika 3.8 sering 503
4. Deploy. Setelah live, Generate memakai route `/api/scrape` dan `/api/summarize` (timeout hingga 60 detik).

Jangan commit `.env.local`. File itu sudah di-ignore.

## Scripts

```bash
npm run dev    # development
npm run build  # production build
npm run start  # jalankan hasil build
npm run lint
```
