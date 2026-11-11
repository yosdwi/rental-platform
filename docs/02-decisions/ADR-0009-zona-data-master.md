---
title: ADR-0009 Zona sebagai data master
type: adr
status: accepted
date: 2026-11-11
---

# ADR-0009 — Zona sebagai data master

## Context

Owner tidak akan menggambar zona terus-menerus. Google tidak menyediakan daftar "daerah terlarang", jadi data zona adalah aset kita sendiri. Formulir GSM sudah menanyakan "tujuan pemakaian".

## Decision

Empat lapis zona:

1. **Area layanan toko** — dibuat otomatis saat onboarding (contoh GSM: Kota Bogor, Dramaga, Ciawi, Sentul). Keluar area → peringatan.
2. **Zona platform** — dikelola admin lajur untuk semua mitra (contoh: pelabuhan penyeberangan Merak, Tanjung Priok). Hanya bisa dibaca owner.
3. **Zona tambahan toko** — jarang dipakai: cari nama daerah → batas wilayah (preset) atau radius → Larang/Pantau → simpan.
4. **Izin per sewa** — tujuan yang dipilih penyewa (mis. Puncak) dicek saat owner menyetujui; bila diizinkan, zona terkait tidak memicu peringatan untuk sewa itu. Owner juga bisa "Izinkan" langsung dari peringatan.

Zona menilai **posisi motor**, bukan asal KTP penyewa. Penilaian penyewa memakai verifikasi dokumen.

## Consequences

- Editor gambar (Terra Draw, ADR-0006) ditunda; ADR-0006 berstatus Deferred.
- Preset batas wilayah di demo masih poligon sederhana; produksi memakai batas administrasi OpenStreetMap.
- Peringatan dapat dicegah sebelum terjadi lewat izin per sewa.
