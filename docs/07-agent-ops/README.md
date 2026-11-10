---
title: Agent Operations
type: playbook
status: active
---

# Multi-Agent Operating Model

## Tujuan

Multi-agent dipakai untuk mempercepat pekerjaan yang terpisah, bukan untuk membuat banyak versi keputusan yang saling bertentangan.

## Peran yang disarankan

### Product/Research agent

Mengumpulkan evidence, merangkum insight, dan mengusulkan keputusan. Tidak mengubah code tanpa handoff.

### UX/Design agent

Menurunkan flow menjadi IA, screen states, component behavior, dan design system. Semua perubahan mengacu ke [[docs/04-design-system/DESIGN-SYSTEM]].

### Domain/API agent

Menjaga entity, state transition, adapter, fixture, dan contract. Semua perubahan dicatat di [[docs/01-product/CORE-RENTAL-MODEL]].

### Frontend agent

Mengimplementasikan satu surface/flow dengan token dan contract yang sudah ada. Tidak membuat vocabulary status baru.

### QA/evidence agent

Memverifikasi happy path, error/empty/loading states, responsive behavior, dan menulis bukti.

## Handoff template

```md
## Handoff

### Scope
-

### Changed files
-

### Decisions
-

### Verification
-

### Risks / open questions
-

### Next agent
-
```

## Rules

- Baca `AGENTS.md` dan `ACTIVE-WORK.md` sebelum mulai.
- Jangan mengambil scope agent lain tanpa menandai perubahan.
- Jika keputusan baru diperlukan, buat ADR sebelum implementasi yang bergantung padanya.
- Satu PR sebaiknya merepresentasikan satu vertical slice atau satu perubahan fondasi yang jelas.
