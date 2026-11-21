# Preprocessing laporan stok

Alur UI: **Upload Excel → pilih sumber / pemetaan → periksa hasil → gunakan data**.
Pratinjau tidak mengubah laporan yang tersimpan. Impor berhasil mengganti snapshot
stok aktif; impor gagal mempertahankan laporan sebelumnya.

## Data yang digunakan

- Saldo stok per produk dan gudang, kode produk jika tersedia, merek, kategori,
  harga satuan, dan minimum per produk/gudang.
- Transfer antar-gudang: tanggal, produk, asal, tujuan, jumlah, dan status.
- Asal angka (sheet, baris, kolom) dan laporan kualitas data.

Satu tabel stok dipilih sebagai sumber utama. Sheet ringkasan, produksi, on-hand,
transit, dan daftar order tidak dijumlahkan bersama karena bisa menggambarkan stok
yang sama atau jenis saldo berbeda. Transfer tidak dianggap penjualan atau
ditambahkan ke saldo akhir. Tidak ada alamat, manajer, penjualan, maupun minimum
yang dibuat dari asumsi.

## Format yang didukung

- `.xlsx` dan `.xls`, maksimum 50 MB.
- Matriks produk × kolom gudang atau satu baris per produk/gudang.
- Variasi nama sheet, huruf besar/kecil, spasi, sinonim Indonesia/Inggris,
  urutan kolom, header bergeser, dan header yang digabung vertikal.
- Deteksi mempertimbangkan isi kolom; nama sheet hanya menambah skor.
- Scan header 80 baris pertama. Format tidak dikenal dapat dipetakan secara manual.
- Untuk matriks, kolom minimum dapat dipilih terpisah bagi setiap gudang; minimum
  umum menjadi fallback. Format baris menggunakan minimum pada baris tersebut.
  Header seperti `Minimum Makassar` dan `Min Stok Maros` juga dikenali otomatis.
- Format non-tabular, header horizontal bertingkat yang ambigu, atau header lewat
  baris 80 sebaiknya dirapikan dengan template pada dialog upload.

Tidak mungkin menebak makna seluruh format Excel dengan aman. Karena itu pemetaan
dan pratinjau selalu tersedia sebelum data digunakan. Template menyimpan satu
baris per produk/gudang, sehingga minimum berbeda antar-gudang mudah diwakili.

## Aturan kualitas

- Kosong / error Excel = tidak diketahui, bukan nol. Tanda `-` = nol sesuai
  format accounting. Nilai negatif tetap dipertahankan untuk rekonsiliasi.
- Angka `1.234` / `1,234` dianggap pemisah ribuan; format campuran seperti
  `1.234,50` / `1,234.50` juga didukung. Gunakan sel numerik asli bila titik atau
  koma tiga digit dimaksudkan sebagai desimal.
- Header berulang dan subtotal dibuang. Baris identik dalam sumber stok diabaikan
  dan dicatat. Batch yang memiliki angka berbeda dipertahankan; batch identik perlu
  digabung di sumber atau diberi identitas yang berbeda sebelum impor.
- Total dihitung dari gudang terpilih, lalu dibandingkan dengan kolom total Excel.
  Selisih ditampilkan, bukan disembunyikan.
- Rumus menggunakan nilai terakhir yang tersimpan di workbook. Rumus tidak
  dihitung ulang. Jika rumus tidak punya hasil, nilainya tidak diketahui; buka,
  hitung ulang, dan simpan workbook di Excel sebelum mengupload.
- Minimum kosong tidak menghasilkan status Aman / Menipis; status **Belum dinilai**.
  Nol = Habis; negatif/tidak diketahui = Periksa. Jika minimum tersedia,
  di bawah minimum = Menipis, di bawah 30% minimum = Kritis.
- Transfer berulang tidak dideduplikasi tanpa ID transaksi karena bisa valid.
  Hanya status Completed / selesai / terkirim / done / delivered masuk grafik
  transfer selesai. Tanggal invalid tidak masuk grafik harian.
- Periode diambil dari nama file/judul laporan, lalu tanggal transfer sebagai
  fallback. Jika tidak tersedia, tampilkan Periode tidak diketahui.

## Visualisasi

| Visual | Kegunaan |
| --- | --- |
| Kartu total, produk/gudang, stok nol, menipis, nilai stok, temuan | Ringkasan saldo dan prioritas pemeriksaan |
| Bar horizontal stok per gudang | Membandingkan konsentrasi stok |
| Donut merek | Komposisi stok positif; negatif diperiksa terpisah |
| Heatmap produk × gudang | 15 produk terbesar dan sebaran stoknya; `?` berarti data belum lengkap |
| Grafik transfer per tanggal + rute terbesar | Melihat arus transfer yang berstatus selesai |
| Tabel filter + ekspor | Telusuri produk/gudang/status serta asal angka |

Filter produk dan merek berlaku pada saldo; filter gudang juga berlaku pada asal
atau tujuan transfer. Nilai stok adalah jumlah stok × harga pada laporan untuk
nilai yang diketahui, bukan pendapatan atau valuasi akuntansi.

## API dan pengujian

`POST /api/upload`: multipart field `file`; `action` = `inspect`, `preview`, atau
`import`. Untuk preview/import, `mapping` merupakan JSON `{ stock, movement }`.
`movement: null` menonaktifkan transfer. `GET /api/upload/template` mengunduh template.
`GET /api/data` membaca snapshot aktif. Penyimpanan JSON menggunakan file sementara
dan rename untuk menghindari laporan setengah tertulis. Penyimpanan masih bersifat
lokal dan bersama seperti aplikasi sebelumnya; ini belum merupakan arsip historis
atau penyimpanan per akun.

```powershell
node --test scripts/inventory.test.cjs
node scripts/preprocess.cjs "D:\Download\laporan.xlsx" "hasil.json"
node scripts/smoke-upload.cjs "D:\Download\laporan.xlsx"
```

Script smoke memerlukan server lokal aktif dan menggunakan **preview** tanpa
mengganti laporan tersimpan. Workbook asli tidak diubah atau ditambahkan ke Git.
Entry point lama `scripts/process-and-save-user-data.js` sekarang memakai parser
yang sama; berbeda dari script preview, menjalankannya akan mengganti snapshot aktif.

## Hasil verifikasi workbook contoh April 2026

Sumber stok: `SUMMARY PER BO`, header baris 4, produk F, gudang G–P,
total Q, harga R. Sumber transfer: tabel kanan `In Out Barang`, header baris 2,
produk M, jumlah N, tanggal I, asal J, tujuan K, status Q.

Hasil: 183 produk unik, 10 gudang, 1.880 catatan stok, 9.728.007 unit saldo bersih,
400 catatan transfer. Ada 9 nilai stok negatif; tidak ada kolom minimum pada sumber
stok ini. Angka tersebut merupakan hasil preprocessing sumber terpilih, bukan
sertifikasi bahwa laporan bisnis sudah benar.
