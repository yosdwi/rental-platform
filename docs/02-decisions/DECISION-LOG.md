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
| ADR-0005 | 2026-11-10 | BookCars adalah kandidat core yang harus diaudit; UI baru mengikuti UX platform kita | Proposed | [[RENTAL-UX-FOUNDATION-RESEARCH]] |
| ADR-0006 | 2026-11-10 | Geofence editor memakai abstraction yang kompatibel dengan Terra Draw, bukan Google Drawing Library | Accepted | [[RENTAL-UX-FOUNDATION-RESEARCH]] |

## Open questions

- Apakah BookCars dipakai sebagai backend/domain core atau hanya referensi setelah audit baseline?
- Apakah owner storefront memakai subdomain, slug, atau link shareable?
- Apakah aturan wilayah default per rental atau per rental session?
- Apakah customer wajib membuat akun atau dapat guest checkout dengan verifikasi?
