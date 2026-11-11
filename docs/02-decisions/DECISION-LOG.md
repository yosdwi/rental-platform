---
title: Decision Log
type: decision-log
status: active
---

# Decision Log

Keputusan aktif diringkas di sini. Keputusan besar memiliki ADR terpisah.

| ID | Tanggal | Keputusan | Status | Dokumen |
| --- | --- | --- | --- | --- |
| ADR-0001 | 2026-11-10 | Mulai dari B2B-first Rental Operating System dengan customer storefront | Accepted | [[docs/02-decisions/ADR-0001-product-positioning]] |
| ADR-0002 | 2026-11-10 | Rental Session menjadi pusat hubungan booking, unit, customer, location, geofence, return, maintenance | Accepted | [[docs/01-product/CORE-RENTAL-MODEL]] |
| ADR-0003 | 2026-11-10 | Bangun thin design foundation lalu functional vertical slice; jangan membuat design system lengkap di awal | Accepted | [[docs/04-design-system/DESIGN-SYSTEM]] |
| ADR-0004 | 2026-11-10 | Demo tracking memakai GPS HP customer; sumber lokasi harus terlihat dan tidak boleh dianggap posisi motor sebenarnya | Accepted | [[docs/05-flows/CORE-RENTAL-FLOW]] |
| ADR-0005 | 2026-11-10 | BookCars adalah kandidat core yang harus diaudit; UI baru mengikuti UX platform kita | Superseded oleh ADR-0007 | [[RENTAL-UX-FOUNDATION-RESEARCH]] |
| ADR-0006 | 2026-11-10 | Geofence editor memakai abstraction yang kompatibel dengan Terra Draw, bukan Google Drawing Library | Deferred (lihat ADR-0009) | [[RENTAL-UX-FOUNDATION-RESEARCH]] |
| ADR-0007 | 2026-11-11 | SaaS untuk owner dulu, aplikasi penyewa sebagai direktori rental; BookCars tidak dipakai | Accepted | [[docs/02-decisions/ADR-0007-saas-first-direktori]] |
| ADR-0008 | 2026-11-11 | Demo frontend-first: Next.js, event store, sinkron Supabase Realtime Broadcast, panel skenario tersembunyi, asisten deterministik | Accepted | [[docs/02-decisions/ADR-0008-arsitektur-demo]] |
| ADR-0009 | 2026-11-11 | Zona sebagai data master 4 lapis: area layanan, zona platform, zona toko, izin per sewa | Accepted | [[docs/02-decisions/ADR-0009-zona-data-master]] |

## Open questions

- ~~Apakah BookCars dipakai?~~ Tidak (ADR-0007).
- ~~Storefront subdomain/slug/link?~~ Demo memakai tautan `/r/<slug>`; subdomain diputuskan nanti.
- ~~Aturan wilayah per rental atau per sesi?~~ Keduanya: area per toko + izin per sesi (ADR-0009).
- Apakah customer wajib akun? Demo: masuk nomor HP + OTP; guest checkout belum.
- Model harga final: flat per toko, per unit, atau berjenjang?
- Data asli GSM (unit, harga paket 12/36/48 jam, denda, radius antar, crew).
