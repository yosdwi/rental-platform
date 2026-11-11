# Rental Platform

Rental Operating System untuk pemilik rental motor, dengan customer storefront yang sederhana dan dapat dibagikan melalui WhatsApp.

Repository ini juga berfungsi sebagai **Obsidian vault**. Semua product thinking, research, keputusan, UX flow, design system, dan progress disimpan sebagai Markdown agar dapat dilanjutkan oleh manusia maupun multi-agent tanpa kehilangan konteks.

## Mulai dari sini

- [[docs/00-home]] — status dan jalur kerja saat ini
- [[docs/01-product/PRODUCT-THESIS]] — positioning dan selling point
- [[docs/01-product/CORE-RENTAL-MODEL]] — objek domain dan state
- [[docs/02-decisions/DECISION-LOG]] — keputusan yang sudah dikunci
- [[docs/04-design-system/DESIGN-SYSTEM]] — fondasi visual yang sengaja dibuat tipis
- [[docs/05-flows/CORE-RENTAL-FLOW]] — vertical slice utama
- [[docs/06-roadmap/DEMO-VERTICAL-SLICE]] — scope demo aktif
- [[docs/07-agent-ops/README]] — cara kerja multi-agent

## Aplikasi demo (`demo/v1`)

Aplikasi **lajur**: satu Next.js app untuk penyewa (`/beranda`) dan owner (`/mitra`). Lihat [[docs/06-roadmap/SPRINT-01-DEMO-PRD]] dan [[docs/06-roadmap/DEMO-SCRIPT]].

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

Opsional `.env.local` (lihat `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SYNC_ROOM`. Tanpa env, aplikasi memakai project Supabase default untuk sinkron antar HP (Realtime Broadcast, tanpa tabel).

Struktur:

- `src/app/(sewa)` — layar penyewa; `src/app/mitra` — layar owner; `src/app/masuk` — masuk.
- `src/lib/domain` — model, data contoh GSM Bogor (`fixtures.ts`), harga, ketersediaan, servis, asisten deterministik.
- `src/lib/store` — event store, reducer, sinkron.
- `src/components` — UI, peta, panel skenario tersembunyi (tekan lama logo).

## Prinsip kerja

1. Satu Rental Session menjadi penghubung booking, motor, customer, lokasi, geofence, return, dan maintenance.
2. Bangun vertical slice yang dapat dicoba sebelum menambah modul besar.
3. Design system dibuat tipis, lalu dimatangkan dari kebutuhan flow nyata.
4. Keputusan yang mengubah arah produk ditulis sebagai ADR sebelum implementasi.
5. Setiap agent bekerja dengan scope terbatas, bukti perubahan, dan handoff tertulis.

Riset awal: [[RENTAL-UX-FOUNDATION-RESEARCH]].
