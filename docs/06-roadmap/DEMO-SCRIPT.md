---
title: Skrip Demo GSM Bogor
type: runbook
status: active
date: 2026-11-11
---

# Skrip Demo GSM Bogor (±10 menit)

Peran: **Yos = owner** (HP 1), **Dito = penyewa** (HP 2). Keduanya membuka tautan Vercel yang sama dan sebaiknya "Tambah ke layar utama" supaya terasa seperti aplikasi.

## Persiapan (sebelum berangkat)

1. Buka aplikasi di kedua HP, pastikan internet aktif.
2. Buka panel **Skenario** (tekan lama logo lajur ±1 detik, atau tombol `` ` `` di laptop) → **Mulai ulang dari awal**. Data contoh jadi segar dan jam fixture mengikuti waktu sekarang. Panel memperlihatkan status "Tersinkron antar perangkat" bila Supabase tersambung.
3. Yos masuk sebagai mitra (tautan "Masuk sebagai mitra"), isi nama. Dito masuk sebagai penyewa dengan nomor HP aslinya (supaya tautan WhatsApp dari owner sampai ke HP Dito).
4. Di HP Yos: Pengaturan → nomor WhatsApp toko sudah terisi dari login. Opsional: unggah QRIS GSM.

## Alur

| # | Siapa | Yang dilakukan | Yang ditunjukkan ke owner |
| --- | --- | --- | --- |
| 1 | Yos | Buka beranda owner | Satu layar: disewa/siap/dipesan/servis, perlu tindakan, ringkasan asisten |
| 2 | Dito | Beranda → lokasi otomatis → GSM Bogor → Vario 125 | Penyewa langsung lihat motor & harga paket, tanpa chat |
| 3 | Dito | Ubah jam kembali +2 jam → saran "kembali lebih awal, hemat" | Kasus 26 jam vs paket 36 jam di chat |
| 4 | Dito | Pesan: titik temu KFC Taman Topi, tujuan "Dalam kota", foto KTP/SIM/selfie, DP Rp40.000, bayar QRIS, kirim WA | Formulir 20 kolom hilang; data terbaca otomatis |
| 5 | Yos | Notifikasi "Permintaan sewa baru" → Tinjau → Setujui & kabari | WhatsApp ke penyewa sudah terisi rapi |
| 6 | Dito | Tiket → "Saya sudah sampai" (+ ciri) | HP Yos: "Dito sudah di titik temu" |
| 7 | Yos | Tombol **Pindai** → scan QR di HP Dito → serah terima 6 langkah → Mulai sewa | Foto kondisi, KM dari speedometer, jaminan, tanda tangan |
| 8 | Dito | Panel Skenario → Perjalanan **Dekat Gadog** (atau Mulai ke Puncak) | Motor bergerak di peta owner |
| 9 | — | Motor keluar area → masuk Puncak | Peringatan kontekstual + Hubungi/Izinkan; penyewa juga diberi tahu |
| 10 | Dito | Panel Skenario → **Putuskan sinyal** | ±25 detik kemudian "Sinyal hilang" dengan lokasi terakhir |
| 11 | Yos/Dito | Panel Skenario → Waktu **Lewat 50 mnt** | "Terlambat kembali" + denda otomatis |
| 12 | Yos | Pengembalian: KM, foto (bandingkan kerusakan), denda, jaminan → Selesai | Vario otomatis **masuk servis (ganti oli)** dan tidak bisa dipesan di HP Dito |
| 13 | Yos | Unit → Vario → Catat & selesai servis "ganti oli 55rb" | Unit siap lagi, muncul kembali di toko |
| 14 | Yos | Sewa → Dari chat WA → tempel formulir lama | Pelanggan yang tetap pesan via chat tetap bisa dicatat dalam 10 detik |

## Variasi

- **Izin ke Puncak:** Dito pilih tujuan "Puncak" saat pesan → Yos setujui dengan izin → perjalanan ke Puncak hanya tercatat "sesuai izin", tanpa peringatan. Menunjukkan pencegahan, bukan hanya alarm.
- **Permintaan masuk tanpa Dito:** panel Skenario → "Kirim permintaan sewa baru".

## Jawaban untuk pertanyaan umum

- *"Kalau HP penyewa dimatikan?"* — Itu justru memicu "Sinyal hilang". Untuk produksi, lokasi bisa diambil dari GPS tracker yang dipasang di motor; alur peringatan tetap sama karena sumber lokasi terpisah dari sesi sewa.
- *"Biayanya?"* — Langganan bulanan murah per toko/unit (lihat ADR-0007).
- *"Data KTP aman?"* — Produksi akan mengikuti UU PDP: enkripsi, akses terbatas, retensi jelas.
