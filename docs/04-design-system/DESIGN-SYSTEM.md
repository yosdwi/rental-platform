---
title: Rental Design System
type: design-system
status: v0.1
---

# Rental Design System

Fondasi ini sengaja tipis. Ia menjadi guardrail agar vertical slice konsisten, bukan proyek terpisah yang harus selesai sebelum flow dibangun.

## Product character

**Clear, calm, operational, trustworthy.**

Owner harus merasa sistem membantu mengambil tindakan. Customer harus merasa booking aman dan mudah dipahami.

## Visual direction

- Light operational canvas.
- Surface putih dengan border slate yang ringan.
- Trust blue untuk primary action.
- Orange/amber untuk attention dan tracking.
- Green untuk ready/success.
- Red hanya untuk risk, breach, atau destructive action.
- Hindari glassmorphism berat, dashboard gelap seperti telematics console, dan grafik dekoratif.

## Tokens v0.1

```css
--color-primary: #2563EB;
--color-primary-soft: #DBEAFE;
--color-attention: #F97316;
--color-success: #16A34A;
--color-danger: #DC2626;
--color-background: #F8FAFC;
--color-surface: #FFFFFF;
--color-text: #1E293B;
--color-muted: #64748B;
--color-border: #E2E8F0;
```

Typography: `Plus Jakarta Sans` sebagai satu family utama untuk heading, body, angka, dan UI.

## Status vocabulary

Status harus konsisten di customer, owner, map, dan maintenance:

- `Ready` — siap disewakan
- `Reserved` — sudah dipesan
- `Active` — sedang disewa
- `Due back` — mendekati/jatuh tempo pengembalian
- `Inspection` — menunggu pemeriksaan
- `Maintenance` — tidak tersedia karena service/perbaikan
- `Alert` — butuh perhatian owner

Warna tidak boleh menjadi satu-satunya pembeda; selalu sertakan label atau icon.

## Component inventory

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
