import Link from "next/link";
export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-8 text-center">
      <div>
        <div className="text-[18px] font-bold">Halaman tidak ditemukan</div>
        <Link href="/" className="mt-3 inline-block text-[14px] font-semibold text-brand">Kembali ke beranda</Link>
      </div>
    </div>
  );
}
