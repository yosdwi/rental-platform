---
title: ADR-0007 SaaS dulu, direktori rental menyusul
type: adr
status: accepted
date: 2026-11-11
supersedes: ADR-0005
---

# ADR-0007 — SaaS dulu, direktori rental menyusul

## Context

Target awal ±10 rental di Bogor & Jogja dengan langganan murah (±Rp100rb/bulan) dan strategi kuantitas dulu. Marketplace penuh butuh pasokan dan permintaan sekaligus, plus pembayaran, escrow, sengketa, dan layanan pelanggan yang mahal untuk tim kecil. Penyewa saat ini datang lewat WhatsApp, Instagram, dan Google Maps milik owner.

BookCars (ADR-0005) adalah aplikasi rental mobil open source yang sempat dipertimbangkan sebagai fondasi backend. Untuk demo dan tahap 1, backend sebesar itu tidak dibutuhkan dan domainnya berbeda (motor, WhatsApp, zona, aturan lokal).

## Decision

1. Produk yang dijual ke owner adalah **langganan SaaS** (Rental OS + tautan toko).
2. Aplikasi penyewa adalah **direktori rental** yang memakai platform: tanpa pembayaran di aplikasi dan tanpa komisi pada tahap 1. Tautan toko dari WhatsApp/IG membuka halaman toko yang sama.
3. Beranda penyewa menampilkan **rental terdekat lebih dulu**, dengan motor yang tersedia langsung terlihat di kartu toko.
4. BookCars **tidak dipakai**; hanya referensi. ADR-0005 berstatus Superseded.

## Consequences

- Nilai bagi owner tidak bergantung pada efek jaringan marketplace.
- Direktori menjadi bonus penjualan ("toko muncul di aplikasi penyewa"), tetapi kita jujur bahwa di awal pelanggan masih datang dari kanal owner.
- Harga perlu dihitung ulang terhadap biaya infrastruktur (Vercel Pro + Supabase Pro ±US$45/bulan saat sudah komersial). Opsi: per unit (mis. Rp10rb/unit/bulan), Rp149rb flat, atau self-host.
- Tahap 2 (direktori sebagai sumber pelanggan) dan tahap 3 (pembayaran, komisi, tracker) butuh ADR baru.
