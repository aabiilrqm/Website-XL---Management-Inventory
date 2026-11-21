# Generator data contoh inventory

Jalankan perintah di folder `xl-inventory-dashboard`. Generator menggunakan Node.js dan paket `xlsx` yang sudah tercantum dalam proyek. Jalankan `npm install` jika dependensi belum terpasang.

```powershell
npm.cmd run generate:data -- --products 100 --warehouses 5 --period "November 2026"
```

Ini membuat 100 produk unik di 5 gudang, sehingga website membaca **500 catatan stok**. Tujuan default adalah `src/lib/data/simulasi-stok-november-2026.xlsx`. Path output relatif dihitung dari folder proyek, meskipun script dijalankan dari folder lain. Untuk mengulang dengan nama file yang sama, tambahkan `--force`.

Di PowerShell Windows, gunakan `npm.cmd` jika `npm.ps1` diblokir execution policy. Script juga bisa dijalankan langsung:

```powershell
node scripts/generate-inventory.cjs --products 100 --warehouses 5
```

## Kustomisasi melalui perintah

```powershell
npm.cmd run generate:data -- --products 250 --warehouses "Makassar,Maros,Bone,Gowa,Bombana" --brands "XL,AXIS,SMARTFREN" --period "Desember 2026" --stock-min 200 --stock-max 5000 --min-stock 100 --price-min 1000 --price-max 75000 --empty-percent 15 --low-percent 20 --critical-percent 10 --empty-warehouses "Bombana" --seed 123 --output "src/lib/data/uji-desember-2026.xlsx"
```

| Opsi | Arti |
| --- | --- |
| `--products` | Jumlah produk unik. Kode produk selalu berbeda. |
| `--warehouses` | Angka jumlah gudang, atau daftar nama dipisahkan koma. |
| `--brands` / `--categories` | Daftar merek dan kategori untuk produk simulasi. |
| `--period` | Nama bulan Indonesia dan tahun 2000–2099. Default bulan saat dijalankan dalam zona Asia/Makassar. |
| `--stock-min` / `--stock-max` | Rentang stok **aman**, inklusif. Batas bawah aktual paling sedikit `--min-stock`. |
| `--min-stock` | Ambang minimum stok, minimal 4. Berlaku untuk setiap produk/gudang. |
| `--price-min` / `--price-max` | Rentang harga satuan simulasi, dalam rupiah. |
| `--empty-percent` | Peluang sebuah catatan memiliki stok nol. |
| `--low-percent` | Peluang stok di bawah minimum, tetapi setidaknya 30% minimum. |
| `--critical-percent` | Peluang stok positif di bawah 30% minimum. |
| `--empty-warehouses` | Gudang tertentu yang seluruh stoknya dibuat nol. Nama harus ada dalam daftar gudang. |
| `--seed` | Angka 0–4294967295. Seed dan konfigurasi sama menghasilkan nilai data yang sama. Ubah untuk variasi baru. |
| `--format` | `matrix` mengikuti format ringkasan contoh, atau `long` untuk satu baris per produk/gudang. |
| `--output` | Lokasi file Excel hasil generator. |
| `--force` | Menimpa file tujuan yang sudah ada. Tanpa opsi ini generator menolak menimpa file. |

Tiga persentase merupakan **peluang per catatan**, sehingga jumlah aktual tidak harus persis sesuai persentasenya. Sisanya menjadi stok aman. Jumlah ketiganya maksimal 100%. Gudang yang dipaksa kosong menambah jumlah catatan stok habis di luar peluang tersebut.

Nama produk, harga, dan stok merupakan simulasi. Jumlah gudang lebih dari 10 menggunakan nama tambahan `CABANG 11`, `CABANG 12`, dan seterusnya. Minimal 1 produk dan 1 gudang, maksimal 100.000 produk, 1.000 gudang, dan 1.000.000 catatan gabungan. Generator juga memeriksa batas file unggahan 50 MB dan presisi total nilai.

## Kustomisasi melalui JSON

Edit `scripts/inventory-generator.example.json`, kemudian jalankan:

```powershell
npm.cmd run generate:data -- --config scripts/inventory-generator.example.json
```

Nama opsi JSON menggunakan camelCase, misalnya `stockMin`, `minStock`, dan `emptyWarehouses`. `warehouses` menerima angka atau array nama. `force` menerima boolean. Opsi command line mengalahkan konfigurasi JSON:

```powershell
npm.cmd run generate:data -- --config scripts/inventory-generator.example.json --products 500 --seed 99 --output "src/lib/data/uji-500-produk.xlsx"
```

Untuk mencoba format tabel per produk/gudang:

```powershell
npm.cmd run generate:data -- --products 50 --warehouses "Makassar,Gowa,Takalar" --format long --output "src/lib/data/uji-format-long.xlsx"
```

## Melihat hasil di website

Generator mencetak lokasi file, total produk/gudang, total stok, nilai persediaan, dan jumlah catatan per status. Gunakan angka tersebut untuk membandingkan hasil analisis website.

Unggah file melalui **Ganti laporan / Upload Excel → Periksa hasil preprocessing → Gunakan data ini**. Generator hanya menulis file Excel; laporan aktif berubah setelah Anda memilih **Gunakan data ini** di website.

Daftar bantuan lengkap:

```powershell
npm.cmd run generate:data -- --help
```
