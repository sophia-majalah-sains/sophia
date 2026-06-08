# Sophia — Jekyll Site

Majalah digital Sophia dibangun dengan Jekyll untuk GitHub Pages.

## Struktur

```
sophia/
├── _articles/          # Semua artikel (file .md)
├── _layouts/           # Template halaman
├── _includes/          # Komponen (nav, footer, auth-modal)
├── assets/
│   ├── css/main.css    # Semua styling
│   ├── js/auth.js      # Sistem login/register
│   └── js/main.js      # Nav, filter, animasi
├── artikel/            # Halaman daftar artikel
├── edisi/              # Halaman daftar edisi majalah
├── tentang/            # Halaman about
├── _config.yml         # Konfigurasi Jekyll
└── index.html          # Homepage
```

## Cara Menulis Artikel Baru

Buat file baru di `_articles/` dengan format nama `judul-artikel.md`.

Isi bagian atas (front matter) wajib:

```yaml
---
layout: article
title: "Judul Artikel"
subtitle: "Subjudul opsional"
rubrik: Sains           # Sains / Teknologi / Budaya / Pojok Anak / Tokoh Inspiratif / Alam & Satwa / Cover Story
date: 2026-04-01
edisi: 3                # Nomor edisi (opsional untuk artikel lepas)
read_time: 7            # Estimasi menit baca
access: free            # free = semua bisa baca | members = harus login
featured: true          # Tampil di hero homepage (opsional, max 1)
tags: [tag1, tag2]
excerpt: "Ringkasan singkat artikel, tampil di card."
cover_image: /assets/images/nama-gambar.jpg   # opsional
---

Isi artikel di sini dalam format Markdown.
```

## Akses Artikel

- `access: free` — Artikel dapat dibaca siapa saja
- `access: members` — Artikel menampilkan 3 paragraf pertama, lalu muncul paywall login

## Rubrik yang Tersedia

| Rubrik | Warna |
|---|---|
| Cover Story | Navy + Gold |
| Sains | Hijau |
| Teknologi | Ungu |
| Budaya | Biru |
| Pojok Anak | Teal |
| Tokoh Inspiratif | Amber |
| Alam & Satwa | Hijau tua |

## Deploy ke GitHub Pages

1. Push semua file ke repo `sophia-majalah-sains/sophia`
2. Di GitHub: Settings → Pages → Source: `main` branch, folder `/ (root)`
3. Site live di `https://sophia-majalah-sains.github.io/sophia`

## Menjalankan Secara Lokal (opsional)

```bash
gem install bundler
bundle install
bundle exec jekyll serve
# Buka http://localhost:4000/sophia
```

## Catatan Auth

Sistem login menggunakan `localStorage` browser. Ini cukup untuk fase awal.
Untuk upgrade ke backend sungguhan (misalnya Supabase atau Firebase), 
ganti fungsi di `auth.js` dengan API calls — strukturnya sudah disiapkan untuk itu.
