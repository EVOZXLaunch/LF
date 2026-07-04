# EVOZX LaunchFuture — Multichain Migration Notes

## Apa yang diubah

**1. Smart contract diganti total** (`abi/factory.json`, `abi/exchange.json`,
`abi/token.json`, `abi/evozx.json`, `abi/deployer.json`) — diambil langsung
dari hasil kompilasi `EVOZXLabs_Production` (LFTFactory, LaunchFutureExchange,
ERC20Max, LFTDeployer). Bukan ABI lama.

**2. Frontend multichain-ready** (`js/config.js`) — semua alamat kontrak,
RPC, explorer, dan payment method sekarang didefinisikan per-chain di array
`NETWORKS`. Ganti chain tinggal tambah satu entry, tidak perlu ubah kode lain.
Dropdown pemilih jaringan otomatis muncul di sebelah status wallet di setiap
halaman (`js/wallet.js`), dan otomatis switch/add chain di MetaMask.

**3. Alur deploy dirombak mengikuti kontrak baru** (`js/factory.js`,
`js/deploy.js`) — kontrak baru punya arsitektur berbeda total dari versi lama:
- `deployWithNative()` — bayar pakai native coin (EVOZ/ETH/BNB/dst), paling
  aman karena tidak perlu approve.
- `deployCreate2()` — bayar pakai token (mis. EVOZX), perlu `approve()` dulu.
- Fee tidak lagi statis — diambil live dari `quoteNativeFee()` /
  `getDeployFee()` tepat sebelum kirim transaksi.
- Sebelum deploy, sistem otomatis mengecek payment method mana yang benar-benar
  `enabled` on-chain (`findAvailablePaymentMethod`), bukan asumsi.

## Kenapa langkah ini mencegah revert

Kontrak baru (`LFTFactoryDeployLib`, `ERC20MaxTaxLib`, `ERC20MaxSecurityLib`)
mewajibkan beberapa aturan ketat yang kalau dilanggar **pasti revert**:

- Total `burnShare + marketingShare + developmentShare + treasuryShare +
  liquidityShare + buybackShare + charityShare` **harus tepat 100**, bahkan
  kalau buy/sell tax dimatikan.
- Kalau salah satu share > 0, wallet penerimanya wajib diisi (bukan alamat 0).
- `maxWalletPercent` / `maxTxPercent` wajib > 0 kalau fitur diaktifkan.
- Pembayaran fee harus menggunakan metode yang benar-benar `enabled` di
  kontrak factory saat itu.

Semua aturan ini sekarang **dihitung otomatis** di `js/deploy.js`
(`buildTaxShares`) sehingga form lama (burn share + marketing wallet +
development wallet) tetap dipakai apa adanya, tapi hasil akhirnya selalu
valid secara matematis sebelum transaksi dikirim. Kalau user tidak mengisi
wallet marketing/development, otomatis 100% diarahkan ke burn (tidak perlu
wallet, tidak akan revert).

Fee juga di-quote ulang tepat sebelum submit (bukan pakai angka lama dari
preview), jadi kalau owner mengubah fee di tengah jalan, transaksi tetap
memakai angka yang benar.

## Yang WAJIB kamu lakukan sebelum go-live

`js/config.js` sudah diisi alamat asli untuk **EVOZ Mainnet (chain 805)**
sesuai yang ada di frontend lama. Untuk chain lain (Ethereum, BSC, Polygon,
Sepolia) alamatnya masih `0x000...000` (placeholder) — chain tersebut
otomatis **disembunyikan** dari dropdown sampai kamu isi alamat asli hasil
deploy kontrak `LFTFactory` + `LaunchFutureExchange` di chain itu. Cukup edit
bagian `contracts: {...}` di `NETWORKS` masing-masing chain.

Kalau utility token pembayaran (selain native coin) di suatu chain bukan
EVOZX tapi token lain, cukup ubah `utilityToken` dan `utilitySymbol`, serta
daftar `paymentSymbols`.

## Simplifikasi yang disengaja (demi keandalan)

- Deploy dengan token pembayaran memakai jalur `deployCreate2` (approve +
  random salt), **bukan** `deployWithPermit`. `deployWithPermit` butuh
  signature EIP-2612 — kalau domain/version-nya meleset sedikit saja,
  transaksi revert. Approve biasa jauh lebih tahan gagal.
- Field lama `tradingControlEnabled` / `tradingEnabled` di form launch tidak
  lagi dikirim saat deploy, karena di kontrak baru trading **selalu** mulai
  nonaktif dan baru bisa diaktifkan lewat `enableTrading()` di halaman token
  (tombol ini sudah ada dan sudah disambungkan).
- Halaman token (`token.html`) menampilkan data dari getter baru
  (`getSecurityConfig`, `getTaxConfig`, `getAnalytics`) karena kontrak lama
  tidak lagi punya getter individual seperti `dexPair()` — sekarang satu
  token bisa punya banyak pair (`isPair` mapping + `setPair()`).

## File yang diganti/ditambah

```
abi/factory.json      ← baru (LFTFactory)
abi/exchange.json     ← baru (LaunchFutureExchange)
abi/token.json        ← baru (ERC20Max)
abi/evozx.json        ← baru (ERC20Max, dipakai utility token)
abi/deployer.json     ← baru (LFTDeployer)
abi/erc20.json        ← baru, ABI ERC20 generik minimal

js/config.js     ← ditulis ulang, multichain
js/wallet.js     ← + network switcher, connect button diperbaiki
js/factory.js    ← ditulis ulang untuk kontrak baru
js/exchange.js   ← ditulis ulang untuk kontrak baru
js/deploy.js     ← ditulis ulang, normalisasi tax share otomatis
js/launch.js     ← disesuaikan ke API deploy.js baru
js/token.js      ← disesuaikan ke getter kontrak baru
js/dashboard.js  ← disesuaikan (MAX_SUPPLY, bukan INITIAL_SUPPLY)
js/explorer.js   ← disesuaikan ke bentuk data baru
js/index.js      ← disesuaikan, kurs EVOZX/native sekarang live on-chain
js/success.js    ← + init wallet, format supply human-readable
```

Semua file sudah dicek sintaks (Node `--check`) dan konsistensi
import/export antar modul — tidak ada `import` yang menunjuk ke fungsi yang
tidak ada.
