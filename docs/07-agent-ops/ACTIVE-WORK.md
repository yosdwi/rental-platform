---
title: Active Work
type: coordination
status: active
---

# Active Work

## Current phase

Sprint 01 — demo presales GSM Bogor ([[docs/06-roadmap/SPRINT-01-DEMO-PRD]]). Aplikasi ada di branch `demo/v1`.

## Active workstreams

| Workstream | Owner | Status | Handoff |
| --- | --- | --- | --- |
| Product thesis and research | Primary agent | Done | [[docs/01-product/PRODUCT-THESIS]] |
| Obsidian/GitHub operating model | Primary agent | In progress | This setup |
| BookCars baseline audit | — | Dibatalkan (ADR-0007) | [Issue #1](https://github.com/yosdwi/rental-platform/issues/1) |
| Customer storefront UX | Claude | Done (demo) | `src/app/(sewa)` · [Issue #2](https://github.com/yosdwi/rental-platform/issues/2) |
| Owner command center UX | Claude | Done (demo) | `src/app/mitra` · [Issue #3](https://github.com/yosdwi/rental-platform/issues/3) |
| Domain/API contract | Claude | Done (demo, client-side) | `src/lib/domain`, `src/lib/store` · [Issue #4](https://github.com/yosdwi/rental-platform/issues/4) |
| Data asli GSM + uji di 2 HP | Yos | Next | [[docs/06-roadmap/DEMO-SCRIPT]] |

## How to update

When starting work, add a row with scope, owner, status, and expected handoff. When done, link the resulting PR, decision, or evidence.

## Handoff — 2026-11-11 (Claude)

### Scope
Aplikasi demo lengkap penyewa + owner, sinkron antar HP, dokumen sprint.

### Changed files
`src/**`, `public/*`, `package.json`, `next.config.ts`, `vercel.json`, `docs/06-roadmap/SPRINT-01-DEMO-PRD.md`, `docs/06-roadmap/DEMO-SCRIPT.md`, ADR-0007/0008/0009, decision log, design system v0.2.

### Decisions
ADR-0007 (SaaS + direktori), ADR-0008 (arsitektur demo), ADR-0009 (zona data master).

### Verification
`next build` lolos; alur penuh diuji otomatis di Chrome headless ukuran HP (masuk → pesan → bayar → setujui → serah terima → perjalanan → peringatan → pengembalian → servis otomatis). Peta dasar & Supabase tidak bisa diakses dari lingkungan uji, jadi sinkron antar HP perlu dicek langsung di Vercel.

### Risks / open questions
Data GSM masih perkiraan; proyek Supabase gratis bisa ter-pause; GPS di iPhone hanya berjalan saat aplikasi terbuka.

### Next agent
Isi data asli GSM di `src/lib/domain/fixtures.ts`, uji 2 HP di preview Vercel, latihan skrip demo.
