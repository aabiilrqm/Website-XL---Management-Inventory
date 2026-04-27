export const stats = [
  {
    title: "Total Stok Gudang",
    value: "128.400",
    description: "Kartu tersedia di gudang Makassar",
  },
  {
    title: "Toko Aktif",
    value: "42",
    description: "Mitra distribusi area Makassar",
  },
  {
    title: "Distribusi Bulan Ini",
    value: "31.250",
    description: "Kartu keluar ke toko",
  },
  {
    title: "Request Masuk",
    value: "8",
    description: "Menunggu persetujuan admin",
  },
];

export const lowStockItems = [
  {
    name: "Kartu Perdana XL 12GB",
    stock: 320,
    threshold: 500,
  },
  {
    name: "Voucher Data 30GB",
    stock: 180,
    threshold: 400,
  },
  {
    name: "Kartu Perdana Xtra Combo",
    stock: 260,
    threshold: 450,
  },
];

export const storeRequests = [
  {
    store: "Toko Sinar Cell",
    item: "Kartu Perdana XL 12GB",
    qty: 200,
    status: "Menunggu",
  },
  {
    store: "Makassar Phone Center",
    item: "Voucher Data 30GB",
    qty: 150,
    status: "Diproses",
  },
  {
    store: "Toko Bintang Seluler",
    item: "Kartu Perdana Xtra Combo",
    qty: 300,
    status: "Menunggu",
  },
];

export const distributions = [
  {
    date: "24 Apr 2026",
    store: "Toko Sinar Cell",
    item: "Kartu Perdana XL 12GB",
    qty: 200,
    status: "Terkirim",
  },
  {
    date: "23 Apr 2026",
    store: "Makassar Phone Center",
    item: "Voucher Data 30GB",
    qty: 150,
    status: "Dalam Proses",
  },
  {
    date: "22 Apr 2026",
    store: "Toko Bintang Seluler",
    item: "Kartu Perdana Xtra Combo",
    qty: 300,
    status: "Terkirim",
  },
];
