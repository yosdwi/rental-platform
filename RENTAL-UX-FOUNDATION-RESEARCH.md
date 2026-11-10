# Rental Platform — UX Foundation Research

Tanggal: 10 November 2026

## Keputusan produk

Produk ini sebaiknya diposisikan sebagai **Rental Operating System untuk pemilik rental motor**, dengan customer storefront yang bisa dibagikan melalui WhatsApp. Marketplace lintas rental adalah kemungkinan tahap lanjut, bukan inti MVP.

Selling point utamanya bukan “punya GPS”, “punya geofence”, atau “punya maintenance” secara terpisah. Nilainya adalah satu perjalanan rental yang saling terhubung:

`booking → pickup → rental aktif → lokasi & aturan wilayah → alert → return → inspection → maintenance → kembali tersedia`

## Temuan benchmark

### Booqable — benchmark operasi rental

Booqable paling kuat sebagai benchmark alur operasional: booking, inventory, availability, pickup/return, pricing, deposit, kontrak, mobile operation, dan downtime maintenance berada dalam satu sistem. Pelajaran utamanya adalah setiap unit perlu memiliki status kesiapan yang jelas dan perubahan status harus memengaruhi availability.

Yang kita adopsi:

- availability sebagai sumber kebenaran, bukan kalender pasif;
- rental period dan harga terlihat sebelum checkout;
- deposit/aturan dekat dengan keputusan booking;
- maintenance membuat unit keluar dari availability;
- staff dapat menyelesaikan pickup/return dari perangkat mobile.

Yang tidak kita salin: gaya visual dan struktur produk komersialnya secara literal.

### BookCars — kandidat fondasi teknis

BookCars sudah memiliki customer search → choose vehicle → checkout, supplier/admin roles, fleet, booking, scheduler, dan frontend/mobile/admin surface. Ini cocok sebagai kandidat codebase untuk audit dan kemungkinan fork, tetapi belum boleh dianggap sebagai UX final atau production-ready untuk rental motor Indonesia.

Rekomendasi: pertahankan domain/backend yang mempercepat booking dan availability bila audit membuktikan layak; bangun ulang atau refactor frontend dengan design system kita sendiri.

### YourBestie — pelajaran konteks rental motor lokal

Alur rental lokal sangat dipengaruhi aturan operasional: verifikasi, order, pembayaran, batas wilayah, durasi 24 jam, antar-jemput, KTP/SIM, deposit, dan jam layanan. Aturan ini harus muncul saat customer mengambil keputusan, bukan disembunyikan di FAQ.

Peluang UX kita: menjelaskan aturan dengan bahasa sederhana, menunjukkan dampaknya pada harga dan availability, serta memberi owner cara mengubah aturan tanpa membuat customer membaca dokumen panjang.

### Traccar — kandidat tracking engine

Traccar sudah menyediakan model device/position/event, geofence polygon/polyline/circle, event enter/exit, permissions, calendar rules, REST API, dan WebSocket live updates. Ini cocok sebagai kandidat engine tracking terpisah, bukan sebagai UX rental utama.

Arsitektur kita harus memisahkan `location source` dari `rental session`, sehingga demo dapat memakai GPS HP penyewa dan versi berikutnya dapat memakai GPS tracker kendaraan tanpa mengubah alur geofence.

### Google Maps + Terra Draw — keputusan map editor

Google Maps Drawing Library sudah tidak tersedia sejak Mei 2026. Untuk editor polygon/circle/line, gunakan Terra Draw atau adapter serupa yang mendukung Google Maps dan provider lain. Ini menjaga kita agar tidak mengikat geofence editor ke API yang sudah decommissioned.

## Product thesis

> Pemilik rental tidak membutuhkan lebih banyak menu. Mereka membutuhkan satu layar yang menjawab: apa yang sedang terjadi, apa yang perlu dilakukan sekarang, dan unit mana yang berisiko.

Customer juga tidak membutuhkan marketplace yang rumit. Mereka membutuhkan cara tercepat untuk menemukan unit yang tersedia, memahami aturan, mengetahui total biaya, dan menyelesaikan booking.

## Core UX

### 1. Owner command center

Home owner bukan dashboard dengan banyak grafik. Urutan prioritasnya:

1. **Action queue** — pickup hari ini, return terlambat, alert geofence, unit belum siap.
2. **Rental status** — Available, Reserved, Active, Due back, Inspection, Maintenance.
3. **Map context** — lokasi rental aktif, last seen, zona, dan event.
4. **Quick actions** — Add unit, create booking, create zone, schedule maintenance.

Map tidak boleh menjadi peta kosong yang berdiri sendiri. Setiap marker harus terhubung ke rental card/drawer berisi motor, penyewa, sisa durasi, last seen, akurasi, dan tindakan yang tersedia.

### 2. Customer storefront

Flow customer harus dapat dilakukan tanpa memahami sistem internal:

`pilih lokasi → pilih tanggal/jam → lihat unit tersedia → pahami harga & aturan → booking`

Prinsipnya:

- jangan meminta login sebelum customer tahu apa yang bisa disewa;
- tampilkan availability dan total biaya sejak awal;
- tampilkan aturan wilayah, deposit, KTP/SIM, dan pickup sebelum CTA final;
- maksimal tiga langkah utama;
- gunakan satu CTA utama per layar;
- setelah booking, tampilkan status dan next action yang konkret.

### 3. Smart geofence

Jangan menjadikan “Master Geofence” sebagai tabel CRUD utama. Primary interaction harus map-first:

1. Cari atau pindahkan map ke area.
2. Pilih preset: Restricted, Operational, atau Monitor.
3. Gambar circle/polygon.
4. Tulis aturan dalam bahasa manusia.
5. Pilih unit/rental session yang terkena aturan.
6. Tentukan respons: in-app alert, notification, atau hanya log.

Contoh preview aturan:

> Jika Honda Vario 160 memasuki Zona Puncak saat rental aktif, beri peringatan kepada owner dan tampilkan last seen.

Alert tidak cukup hanya “Geofence breached”. Alert harus memuat motor, penyewa, zona, waktu, last seen, akurasi lokasi, dan tindakan: hubungi penyewa, beri izin, tandai ditangani, atau buka riwayat.

### 4. Rental readiness dan maintenance

Maintenance harus dimulai dari status unit, bukan menu terpisah:

`Ready → Booked → Active → Due back → Inspection → Ready`

Jika ada masalah:

`Inspection → Maintenance → Ready`

Saat unit diberi downtime, sistem harus langsung mengeluarkannya dari availability. Owner tidak perlu mengingat untuk memblokir kalender secara manual.

## MVP vertical slice

Yang perlu dibuat terlebih dahulu:

1. Owner membuat satu unit motor dengan tarif, lokasi pickup, dan status Ready.
2. Customer membuka storefront/link rental dan memilih tanggal.
3. Customer membuat booking dengan total biaya dan aturan yang jelas.
4. Owner mengonfirmasi pickup dan mengaktifkan Rental Session.
5. GPS HP customer mengirim posisi selama sesi demo.
6. Owner melihat active rental, last seen, dan event di map.
7. Owner membuat satu zona polygon dan menerima alert enter/exit.
8. Owner menyelesaikan return, inspection, dan menjadwalkan maintenance.
9. Unit otomatis kembali tersedia setelah maintenance selesai.

Yang belum perlu untuk demo:

- marketplace nasional;
- real payment gateway, refund, dan settlement;
- hardware GPS production;
- AI untuk menyarankan zona berbahaya;
- analytics keuangan lengkap;
- multi-vendor rules yang kompleks.

## Design system direction

### Karakter visual

**Light operational canvas**: putih/slate sebagai dasar, trust blue untuk primary actions, orange/amber untuk attention dan tracking, green untuk ready/success, red hanya untuk risiko atau breach. Gunakan data-dense layout pada owner surface tetapi tetap beri ruang dan hierarchy yang jelas.

Hindari dashboard gelap yang terlihat seperti telematics console, glassmorphism berlebihan, kartu dengan terlalu banyak shadow, dan grafik yang tidak membantu tindakan.

### Tipografi

Rekomendasi awal: **Plus Jakarta Sans** sebagai single family untuk heading, body, angka, dan UI. Ini menjaga produk terasa modern, ramah, dan mudah dibaca di mobile maupun dashboard.

Alternatif jika ingin kontras editorial: Poppins untuk heading dan Open Sans untuk body.

### Token awal

```text
primary:       #2563EB
primary-soft:  #DBEAFE
attention:     #F97316
success:       #16A34A
danger:        #DC2626
background:    #F8FAFC
surface:       #FFFFFF
text:          #1E293B
muted:         #64748B
border:        #E2E8F0
```

Status colors harus selalu ditemani label/icon, bukan warna saja. Alert geofence perlu memiliki prioritas yang jelas dan tidak menggunakan animasi yang mengganggu.

### Komponen inti

- `RentalStatusChip`
- `ActionQueue`
- `MetricCard`
- `RentalRow`
- `VehicleCard`
- `AvailabilityCalendar`
- `RentalSessionDrawer`
- `MapMarker`
- `MapEventPanel`
- `GeofenceRuleBuilder`
- `MaintenanceTaskCard`
- `BookingStepper`
- `PriceBreakdown`
- `ConditionChecklist`

Komponen harus memakai satu vocabulary status dan satu model data rental session. Jangan membuat versi status berbeda antara customer, owner, map, dan maintenance.

## Keputusan implementasi

1. Audit BookCars sebagai candidate core; jangan langsung mengadopsi seluruh UI.
2. Bentuk frontend berdasarkan vertical slice, bukan menu/module list.
3. Buat adapter untuk `Vehicle`, `Booking`, `RentalSession`, `LocationEvent`, `Geofence`, dan `MaintenanceTask`.
4. Gunakan map sebagai context + action surface, bukan sekadar visualisasi.
5. Implementasikan geofence dengan Terra Draw-compatible abstraction.
6. Gunakan mobile-first untuk customer dan mobile operational actions; owner desktop/tablet mendapat split view map + action panel.
7. Untuk table kompleks, gunakan pola data table dengan sorting/filter/pagination; pada mobile ubah menjadi card/list, bukan memaksa tabel melebar.

## Kriteria UX berhasil

- Customer dapat membuat booking pertama tanpa penjelasan lisan.
- Owner dapat memahami status armada dan tindakan penting dalam kurang dari 10 detik.
- Alert geofence menjawab apa yang terjadi, pada unit mana, kepada siapa, kapan, dan tindakan berikutnya.
- Maintenance otomatis memengaruhi availability.
- Demo terasa sebagai satu perjalanan rental, bukan kumpulan halaman.

## Referensi

- [Booqable rental software](https://booqable.com/)
- [Booqable scooter rental software](https://booqable.com/industries/scooter-rental-software/)
- [BookCars official site](https://bookcars.github.io/)
- [BookCars architecture and UI overview](https://github.com/aelassas/bookcars/wiki/Overview)
- [YourBestie FAQ](https://yourbestie.id/faq/)
- [Traccar geofences](https://www.traccar.org/geofences/)
- [Traccar API](https://www.traccar.org/traccar-api/)
- [Google Maps deprecations](https://developers.google.com/maps/deprecations)
- [Terra Draw project](https://www.osgeo.org/projects/terra-draw/)
