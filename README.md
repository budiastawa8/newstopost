# NewsToPost

Ubah URL berita jadi carousel Instagram/Facebook: scrape artikel, ringkas dengan Gemini, preview slide, unduh ZIP PNG.

## Stack

- Next.js (App Router) + Tailwind + shadcn/ui
- Gemini API (ringkasan + caption/hashtag)
- html-to-image + JSZip (export PNG)
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
