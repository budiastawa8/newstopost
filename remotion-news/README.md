# remotion-news (NewsToPost)

Render **News → Motion Graphic** dari `brief.json` yang diunduh di app NewsToPost.

## Setup

```powershell
cd G:\BUDIAST\newstopost\remotion-news
npm install
py -3 -m pip install edge-tts
```

## Render

```powershell
.\render.ps1 -Brief C:\Users\BUDIAST\Downloads\news-brief-....json
```

Hasil: `out/news-motion.mp4`

Pipeline: TTS (edge-tts) → subtitle sync karaoke → download foto berita (`public/media/`) → Remotion MP4. Tanpa CapCut.

Foto diambil otomatis dari `imageUrl` di brief (hasil scrape NewsToPost). Jika download gagal, beat itu fallback ke gradient.
