import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <Image
        src="/logo.png"
        alt="NewsToPost"
        width={72}
        height={72}
        className="h-[72px] w-[72px] rounded-2xl ring-1 ring-black/10"
      />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-zinc-900">Anda offline</h1>
        <p className="text-sm leading-relaxed text-zinc-500">
          NewsToPost butuh koneksi untuk scrape berita dan Gemini. Hubungkan
          internet lalu coba lagi.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Coba lagi
      </Link>
    </main>
  );
}
