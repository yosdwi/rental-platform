---
title: Sprint 01 — PRD Demo Presales
type: prd
status: active
date: 2026-11-11
---

# Sprint 01 — PRD Demo Presales

## Tujuan

Membuat aplikasi yang bisa didemokan langsung ke pemilik rental (target pertama: GSM Bogor) memakai dua HP: satu sebagai **penyewa**, satu sebagai **owner**. Demo harus terasa seperti produk jadi: tanpa tombol atau label "demo", dan alurnya bisa dicoba sungguhan.

Keberhasilan sprint: owner paham nilai produk dalam satu kali demo ±10 menit dan mau lanjut ke uji coba.

## Positioning

Lihat [[docs/02-decisions/ADR-0007-saas-first-direktori]].

- **Tahap 1 (sekarang):** SaaS untuk owner (langganan murah) + direktori rental untuk penyewa. Tanpa pembayaran di aplikasi, tanpa komisi.
- **Tahap 2:** setelah kota cukup padat, direktori menjadi sumber pelanggan (ulasan, antar ke stasiun).
- **Tahap 3:** pembayaran/deposit di aplikasi, komisi, integrasi GPS tracker.

## Persona

| Persona | Kebutuhan utama | Perangkat |
| --- | --- | --- |
| Owner / crew rental | Tahu apa yang perlu dilakukan sekarang, motor di mana, kapan siap disewa lagi | HP (utama), laptop |
| Penyewa (wisatawan, mahasiswa, harian) | Cepat tahu motor tersedia, harga total, aturan, lalu pesan | HP |

## Insight dari chat WhatsApp GSM Bogor

Ringkasan alur nyata (data pribadi tidak disimpan di repo):

| Kondisi sekarang | Jawaban produk |
| --- | --- |
| Auto-reply minta maaf "slow respon, orderan ramai"; owner harus "cek dulu" stok | Ketersediaan per jam langsung terlihat; saran "tersedia mulai jam X" saat unit sedang kembali |
| Penyewa harus bertanya "motor tipe apa" | Foto/ilustrasi, tipe, dan harga tiap unit langsung terlihat |
| Formulir ±20 kolom, tanggal diketik dua kali, tahan unit 15 menit secara lisan | Data diri & dokumen disimpan sekali; booking hanya waktu, tujuan, titik ambil/kembali; hitung mundur "unit ditahan" |
| Sewa 26 jam baru ketahuan kena paket 36 jam | Harga paket berubah langsung + saran "kembali lebih awal, hemat Rp…" |
| QRIS dikirim sebagai gambar, DP minimal per motor, bukti bayar screenshot | QRIS toko + nominal di aplikasi, unggah bukti, owner konfirmasi |
| Aturan Jumat–Minggu & tanggal merah hanya di titik temu terlewat oleh owner | Aturan dijalankan sistem: opsi antar otomatis nonaktif |
| Petunjuk jalan ke titik temu diketik panjang | Titik temu disimpan sekali: pin peta + petunjuk |
| Sulit saling menemukan di titik temu | Tombol "Saya sudah sampai" + ciri-ciri; crew dapat notifikasi |
| Riwayat chat hilang (pesan sementara 90 hari) | Riwayat sewa & pelanggan tersimpan |
| Formulir sudah menanyakan "tujuan pemakaian" | Tujuan dipakai untuk izin zona sebelum menyetujui |

## Scope yang dibangun (sprint ini)

### Penyewa (mobile-first)

1. Splash beranimasi → masuk dengan nomor HP + OTP (terisi otomatis) → nama → izin lokasi.
2. Beranda: "Mau sewa di mana?" (lokasi GPS otomatis, bisa diganti; pilihan cepat Stasiun Bogor, Surya Kencana, Sentul), jam ambil & lama sewa, **rental terdekat** dengan motor yang tersedia langsung terlihat.
3. Cari motor (filter Matic/Besar/Klasik), halaman toko (aturan, titik temu), detail motor (paket 12/24/36/48 jam, saran hemat).
4. Pesan: waktu, titik temu/antar (aturan akhir pekan), **tujuan** (Dalam kota/Sentul/Puncak/Luar kota), verifikasi KTP/SIM C/selfie (dibaca otomatis), DP atau lunas, QRIS + unggah bukti, kirim ke WhatsApp rental.
5. Tiket sewa dengan **QR** untuk serah terima, "Saya sudah sampai", sewa aktif (hitung mundur, lokasi dibagikan, peta), perpanjang sewa, riwayat.

### Owner (mobile + desktop)

1. Beranda "hari ini": status armada, **perlu perhatian** (peringatan), **perlu tindakan** (permintaan, sudah tiba, ambil/kembali hari ini, cek kondisi, servis jatuh tempo), ringkasan asisten, pendapatan bulan ini.
2. Sewa: masuk/aktif/akan datang/selesai, tinjau & setujui (izin tujuan, crew) → pesan WhatsApp otomatis terisi, **buat sewa dari chat WA** (tempel formulir → terbaca otomatis).
3. **Pindai tiket** (kamera, QR) → serah terima: cocokkan penyewa, foto 4 sisi, speedometer → KM & bensin, jaminan & perlengkapan, pembayaran, tanda tangan.
4. **Peta live**: semua motor disewa, zona, rute, detail sesi (terakhir terlihat, akurasi, sumber lokasi), aksi Hubungi/Izinkan/Beres.
5. **Peringatan kontekstual**: keluar area layanan, masuk zona larangan, sinyal hilang, terlambat — selalu dengan unit, penyewa, waktu, lokasi, dan tindakan.
6. Pengembalian: KM, cek kerusakan (bandingkan foto), denda telat, bensin, kembalikan jaminan → **servis otomatis** bila jatuh tempo (unit tidak bisa dipesan).
7. Unit & servis: daftar & tambah unit, interval oli mesin/gardan/CVT, prediksi hari servis + jadwalkan di hari kosong, catat servis bebas ("ganti oli 55rb").
8. Pengaturan: tautan toko, aturan, harga paket, titik temu, **area & zona** (data master), QRIS, crew.

### Zona sebagai data master

Lihat [[docs/02-decisions/ADR-0009-zona-data-master]]. Empat lapis: area layanan toko, zona dari platform (dikelola lajur), zona tambahan toko (cari nama daerah → batas wilayah atau radius), izin per sewa dari tujuan yang diisi penyewa.

### Asisten (deterministik)

Tanpa model AI sungguhan di demo; hasil dihitung dari data & aturan (lihat `src/lib/domain/ai.ts`): baca KTP/SIM, cocok wajah, baca speedometer, bandingkan kerusakan, baca formulir WA, catatan servis, ringkasan harian, prioritas peringatan.

## Tidak dibangun

- Payment gateway, escrow, komisi, refund.
- Integrasi GPS tracker (dijelaskan sebagai tahap berikutnya via Traccar).
- Marketplace penuh, ulasan, aplikasi native.
- WhatsApp Business API (kirim tanpa ketuk). Sprint ini memakai tautan `wa.me` dengan pesan terisi.
- Daftar hitam penyewa lintas rental (risiko data pribadi).

## Asumsi yang perlu dikonfirmasi ke GSM

- Harga paket selain Vario 24 jam (Rp140.000) masih perkiraan.
- Daftar 10 unit, plat, dan warna masih fiktif.
- Denda telat per jam (Rp15.000) dan toleransi 15 menit.
- Radius antar dan ongkos antar.
- Nama crew.

## Kriteria berhasil

- Penyewa menyelesaikan booking pertama tanpa penjelasan lisan.
- Owner memahami status armada & tindakan penting < 10 detik.
- Peringatan menjawab apa, unit mana, siapa, kapan, di mana, dan tindakan berikutnya.
- Servis memengaruhi ketersediaan secara otomatis.
- Tidak ada teks "demo", "dummy", atau "contoh" di layar.

## Skrip demo

Lihat [[docs/06-roadmap/DEMO-SCRIPT]].
