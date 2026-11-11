---
title: ADR-0008 Arsitektur demo frontend-first
type: adr
status: accepted
date: 2026-11-11
---

# ADR-0008 — Arsitektur demo frontend-first

## Context

Sprint ini menghasilkan demo presales yang dimainkan di dua HP (owner & penyewa) dan harus terasa seperti produk jadi. Tidak butuh database kompleks; yang penting UX, alur fungsional, dan sinkron real-time antar HP.

## Decision

- **Next.js 16 + React 19 + Tailwind v4**, satu aplikasi untuk dua peran (`/beranda…` penyewa, `/mitra…` owner). Peran ditentukan oleh akun saat masuk.
- Komponen gaya shadcn yang ditulis langsung dengan token kita; **vaul** untuk bottom sheet, **sonner** untuk toast, **motion** untuk animasi.
- **State sebagai event log** (`src/lib/store`): setiap aksi adalah event yang diterapkan reducer deterministik dan disimpan di `localStorage`.
- **Sinkron** lewat **Supabase Realtime Broadcast** (tanpa tabel, cukup publishable key) + `BroadcastChannel` antar-tab. Perangkat saling bertukar snapshot berdasarkan `(epoch, rev)`; gambar (selfie, bukti bayar, QRIS) dikirim terpisah sebagai pesan media.
- **Peta**: MapLibre + OpenFreeMap (tanpa API key), Turf untuk zona.
- **Lokasi**: GPS HP penyewa selama sewa aktif (dengan detak & wake lock) dan rute simulasi.
- **Panel Skenario tersembunyi** (tekan lama logo / tombol `` ` ``) untuk menggerakkan motor, memutus sinyal, memajukan waktu, membuat permintaan masuk, dan memulai ulang data. Tidak ada label "demo" di layar; penanda data contoh hanya di kode (`src/lib/domain/fixtures.ts`).
- **Asisten deterministik** (`src/lib/domain/ai.ts`) menggantikan model AI di demo.

## Consequences

- Tidak ada server/DB yang perlu dijaga untuk demo; data hidup di perangkat dan tersinkron selama online.
- Konflik dua perangkat yang sama-sama offline lalu online diselesaikan "rev tertinggi menang" — cukup untuk demo, tidak untuk produksi.
- Proyek Supabase gratis di-pause setelah seminggu tidak aktif; pastikan aktif sebelum demo.
- Produksi butuh backend nyata (auth, Postgres, RLS, penyimpanan dokumen terenkripsi) dan ADR terpisah.
