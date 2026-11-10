# Rental Platform

Rental Operating System untuk pemilik rental motor, dengan customer storefront yang sederhana dan dapat dibagikan melalui WhatsApp.

Repository ini juga berfungsi sebagai **Obsidian vault**. Semua product thinking, research, keputusan, UX flow, design system, dan progress disimpan sebagai Markdown agar dapat dilanjutkan oleh manusia maupun multi-agent tanpa kehilangan konteks.

## Mulai dari sini

- [[docs/00-home]] — status dan jalur kerja saat ini
- [[docs/01-product/PRODUCT-THESIS]] — positioning dan selling point
- [[docs/01-product/CORE-RENTAL-MODEL]] — objek domain dan state
- [[docs/02-decisions/DECISION-LOG]] — keputusan yang sudah dikunci
- [[docs/04-design-system/DESIGN-SYSTEM]] — fondasi visual yang sengaja dibuat tipis
- [[docs/05-flows/CORE-RENTAL-FLOW]] — vertical slice utama
- [[docs/06-roadmap/DEMO-VERTICAL-SLICE]] — scope demo aktif
- [[docs/07-agent-ops/README]] — cara kerja multi-agent

## Prinsip kerja

1. Satu Rental Session menjadi penghubung booking, motor, customer, lokasi, geofence, return, dan maintenance.
2. Bangun vertical slice yang dapat dicoba sebelum menambah modul besar.
3. Design system dibuat tipis, lalu dimatangkan dari kebutuhan flow nyata.
4. Keputusan yang mengubah arah produk ditulis sebagai ADR sebelum implementasi.
5. Setiap agent bekerja dengan scope terbatas, bukti perubahan, dan handoff tertulis.

Riset awal: [[RENTAL-UX-FOUNDATION-RESEARCH]].
