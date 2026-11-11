---
title: Rental Design System
type: design-system
status: v0.2
---

# Rental Design System

Fondasi ini sengaja tipis. Ia menjadi guardrail agar vertical slice konsisten, bukan proyek terpisah yang harus selesai sebelum flow dibangun.

## Product character

**Clear, calm, operational, trustworthy.**

Owner harus merasa sistem membantu mengambil tindakan. Customer harus merasa booking aman dan mudah dipahami.

## Visual direction (v0.2 — mengikuti referensi "Skyward")

- Brand **navy** untuk header, tombol utama, dan tab aktif; kanvas abu kebiruan terang; kartu putih radius besar.
- Header navy bertekstur titik halus dengan kartu pencarian yang menumpuk di atasnya.
- **Kartu tiket** (sobekan + QR) untuk sewa penyewa.
- Navigasi **pill mengambang** + tombol bulat (Tiket untuk penyewa, Pindai untuk owner).
- Warna status hanya untuk status; merah hanya untuk risiko/pelanggaran.
- Tanpa paragraf penjelasan: label 1–3 kata, angka, dan status yang menjelaskan.
- Ilustrasi motor flat buatan sendiri (`MotorArt`), warna mengikuti unit.

## Tokens v0.2

Sumber: `src/app/globals.css` (`@theme`).

```css
--color-brand: #1e2a78;   --color-brand-soft: #ebedf8;
--color-canvas: #f3f4f9;  --color-surface: #ffffff;
--color-ink: #14172b;     --color-muted: #6b6f85;  --color-line: #e4e6ef;
--color-ok: #1f7a4d;      --color-info: #0e6e8c;   --color-warn: #b4610e;
--color-danger: #c0362c;  --color-check: #6941c6;  --color-maint: #55575f;
--radius-card: 22px;      --radius-field: 14px;
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

Typography: `Plus Jakarta Sans` (variable, self-hosted via fontsource), angka memakai tabular figures (`.num`).

## Status vocabulary

Kode tetap bahasa Inggris; label UI bahasa Indonesia (`src/lib/domain/status.ts`):

| Kode | Label | Warna |
| --- | --- | --- |
| `ready` | Siap | hijau |
| `reserved` | Dipesan | biru laut |
| `active` | Disewa | navy |
| `due` | Segera kembali | amber |
| `overdue` | Terlambat | merah |
| `inspection` | Cek kondisi | ungu |
| `maintenance` | Servis | abu |

Istilah UI: Zona (bukan geofence), Sewa (bukan rental session), Serah terima, Pengembalian, Cek kondisi.

## Motion

- 150–300 ms, `ease-out` kustom; spring ringan untuk tab dan sheet.
- Tombol mengecil 3% saat ditekan; bottom sheet bisa diseret (vaul).
- Marker peta bergerak halus (tween 900 ms), cincin berdenyut untuk peringatan.
- `prefers-reduced-motion` dihormati.

Warna tidak boleh menjadi satu-satunya pembeda; selalu sertakan label atau icon.

## Component inventory (status implementasi demo)

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

## Interaction rules

- Satu primary action per surface.
- Map marker selalu membuka konteks, bukan hanya tooltip.
- Alert selalu menjawab: apa, unit mana, siapa, kapan, lokasi terakhir, dan tindakan berikutnya.
- Table desktop berubah menjadi card/list pada mobile.
- Loading, empty, error, permission denied, dan stale location harus didesain sejak awal.
- Gunakan icon SVG konsisten; jangan menggunakan emoji sebagai icon UI.
