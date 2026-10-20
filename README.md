# Expert Review SJT SOC

Form penilaian ahli untuk 30 skenario SJT Sense of Community Batalyon TNI AD. Menggunakan SurveyJS Form Library 2.5.23 (MIT), dengan hasil tersimpan di Supabase.

## GitHub Pages

Publikasikan branch main dari folder /(root) melalui Settings > Pages > Deploy from a branch. Berkas index.html menjadi halaman awal. Tidak memerlukan proses build.

## Pengisian

Pengantar → Identitas ahli → 30 skenario → Kesimpulan dan rekomendasi → Kirim penilaian. Form menampilkan sukses setelah Supabase mengonfirmasi penerimaan. Jawaban tetap dapat dikirim ulang bila jaringan gagal.

Konfigurasi frontend di backend-config.js memakai publishable key. Tidak ada service-role key, secret key, atau password database di repository. Hasil ahli tidak disimpan di GitHub dan tidak dapat dibaca lewat kunci publik frontend.

Library dan lisensi SurveyJS tersedia di folder vendor. Tidak ada data simulasi atau dokumen sumber penelitian dalam paket publikasi ini.
