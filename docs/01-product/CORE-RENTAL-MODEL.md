---
title: Core Rental Model
type: domain
status: active
---

# Core Rental Model

## Entity utama

| Entity | Peran |
| --- | --- |
| `Rental` | Tenant/bisnis owner dan storefront-nya |
| `Vehicle` | Unit motor yang dapat disewakan |
| `Customer` | Penyewa dan identitas booking |
| `Booking` | Permintaan/reservasi sebelum sesi aktif |
| `RentalSession` | Sesi nyata sejak pickup sampai return |
| `LocationSource` | HP customer, GPS tracker, atau provider lain |
| `LocationEvent` | Posisi, last seen, akurasi, dan timestamp |
| `Geofence` | Aturan wilayah berbentuk circle/polygon/polyline |
| `GeofenceEvent` | Enter/exit dan status penanganannya |
| `MaintenanceTask` | Pemeriksaan, service, repair, dan downtime |
| `Transaction` | Harga, deposit, pembayaran, dan penyesuaian |

## Status vehicle

`Ready → Reserved → Active → Due back → Inspection → Ready`

Jika ada isu:

`Inspection → Maintenance → Ready`

## Status booking

`Draft → Pending → Approved → Rejected → Cancelled`

Booking `Approved` menjadi `RentalSession` ketika pickup dikonfirmasi.

## Status rental session

`Scheduled → Active → Return pending → Returned → Closed`

## Prinsip domain

- Availability diturunkan dari booking, rental session, dan maintenance downtime.
- Location source dapat berubah tanpa mengubah identitas rental session.
- Geofence membaca event dari location source dan konteks rental session.
- Return menghasilkan inspection; inspection dapat membuat maintenance task.
