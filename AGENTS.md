# Agent Instructions — Rental Platform

## Sebelum bekerja

Baca dalam urutan berikut:

1. `README.md`
2. `docs/00-home.md`
3. `docs/02-decisions/DECISION-LOG.md`
4. `docs/07-agent-ops/ACTIVE-WORK.md`
5. Dokumen flow atau design system yang relevan dengan scope-mu

## Aturan kolaborasi

- Jangan mengarang requirement yang belum ada di dokumen atau percakapan.
- Jangan mengubah positioning, domain model, atau core flow tanpa menulis ADR.
- Satu agent mengerjakan satu scope yang dapat diverifikasi.
- Hindari refactor besar yang tidak diperlukan untuk vertical slice aktif.
- Jika menemukan keputusan yang belum jelas, catat sebagai `Open Question`; jangan diam-diam memilih arah yang mengubah produk.
- Update `docs/07-agent-ops/ACTIVE-WORK.md` saat mulai dan selesai bekerja.
- Handoff harus menyebutkan file yang berubah, keputusan baru, risiko, dan langkah berikutnya.

## Aturan dokumentasi

- Product docs ditulis dalam Bahasa Indonesia; nama entity, status, dan kode tetap memakai istilah teknis yang konsisten.
- Gunakan wikilink Obsidian jika merujuk dokumen lain.
- Keputusan permanen masuk ke `docs/02-decisions/DECISION-LOG.md` dan, jika berdampak besar, dibuatkan ADR terpisah.
- Jangan menghapus keputusan lama; tandai `Superseded` dan tautkan keputusan penggantinya.

## Aturan implementasi

- Utamakan core flow: booking → rental session → location/geofence → return → maintenance.
- Jangan membangun marketplace nasional, payment production, atau hardware GPS sebagai prasyarat demo.
- Semua UI baru harus menggunakan token dan vocabulary status dari [[docs/04-design-system/DESIGN-SYSTEM]].
- Semua data demo harus jelas ditandai sebagai fixture/demo jika belum berasal dari sistem nyata.
- Sebelum handoff, jalankan pemeriksaan yang relevan dan tulis hasilnya.
