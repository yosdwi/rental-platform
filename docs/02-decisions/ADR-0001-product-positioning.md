---
title: ADR-0001 Product Positioning
type: adr
status: accepted
date: 2026-11-10
---

# ADR-0001 — Product Positioning

## Context

Marketplace rental membutuhkan supply dan demand sekaligus. Pemilik rental sudah memiliki bisnis dan customer, tetapi operasi booking, armada, lokasi, aturan wilayah, dan maintenance masih dapat tersebar di banyak channel.

## Decision

Mulai sebagai **B2B-first Rental Operating System** dengan customer storefront yang dapat dibagikan owner. Marketplace lintas rental hanya menjadi kemungkinan lanjutan.

## Consequences

- Demo dapat langsung menunjukkan nilai kepada owner tanpa menunggu network effect marketplace.
- Owner dan customer tetap terhubung dalam satu transaksi.
- Sistem membutuhkan tenant/storefront boundary sejak awal, tetapi tidak membutuhkan marketplace discovery penuh.
- Selling point utama adalah rental visibility dan readiness, bukan sekadar listing unit.

## Rejected for MVP

- Marketplace nasional.
- Komisi marketplace sebagai satu-satunya model bisnis.
- Hardware GPS sebagai prasyarat demo.
