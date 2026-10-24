# YouTube İndirme API Araştırması — 2026-10-24

Bu belge, OttiTok'un YouTube indirme akışı için alternatif / yedek servislerin
**canlı olarak test edilmesi** sonucunda oluşturulmuştur. Testler sandbox içinden
yapılmıştır; bazı hedefler sandbox ağ politikası gereği doğrudan `fetch` ile
erişilemediği için HTTP-okuyucu üzerinden doğrulanmıştır. Kesin sonuç için kendi
makineninde `node scripts/test-download-apis.mjs` çalıştır.

## Kısa sonuç (TL;DR)

| # | Servis | Tür | Anahtar | YouTube video (MP4) | Karar |
|---|--------|-----|---------|---------------------|-------|
| 1 | `mp3-apisi.onrender.com` (senin servisin) | Render / özel | `sk-…` key | MP3 ✅ · MP4 ❌ kırık | MP3 için kullan, MP4 için yedek şart |
| 2 | **Kendi Cobalt instance'ın** (`render.yaml`) | Self-host Cobalt v11 | isteğe bağlı | ✅ | **Tavsiye edilen çözüm** |
| 3 | `rue-cobalt.xenon.zone` | Cobalt community v11.7.1 | **yok (korumasız)** | ✅ tracker'a göre | Test et, üretimde hardcode etme |
| 4 | `cobaltapi.cjs.nz` | Cobalt community v11.5 | **yok (korumasız)** | ❌ `error.api.youtube.login` | Kullanma |
| 5 | `api.cobalt.tools` | Resmî Cobalt v11.7.1 | Turnstile | ❌ servis listesinde youtube yok | Kullanma |
| 6 | `btch-downloader-api` (Vercel demo) | No-auth REST | yok | ❌ upstream degraded | Kullanma |
| 7 | Invidious / Piped public instance'ları | Açık proxy | yok | ❌ 401/403/502/disabled | Kullanma |
| 8 | yt-dlp 2026.10.21 | Kütüphane/CLI | yok | ✅ (lokal ağda) | Kendi sunucunda en sağlamı |
| 9 | RenderIO / Apify / RapidAPI | Ücretli yönetilen | var | ✅ | Ücretli yedek |
| ⚠️ | `sparkdustscheme/Youtube-Music-API-Downloader` | GitHub repo | — | — | **ZARARLI — İNDİRME** |

---

## 1. Senin mevcut servisin: `mp3-apisi.onrender.com`

`GET /api/v1/health` → `{"ffmpeg":true,"ok":true,"servis":"sarki-api","surum":"4.9", ...}` ✅ ayakta.

Test edilen uçlar (key: repodaki `sk-71c6…` — **çalışıyor**):

| Uç | İstek | Sonuç |
|----|-------|-------|
| `/api/v1/search?q=never gonna give you up&limit=3` | GET | ✅ 3 gerçek sonuç, kapak+kanal+süre |
| `/api/v1/instant?q=test` (mp3) | GET | ✅ job oluştu |
| `/api/v1/status/171e6e4395` | GET | ✅ `durum:bitti`, 14.7 sn, mp3 hazır |
| `/api/v1/link?q=me at the zoo&format=mp3` | GET | ✅ direkt CDN linki (kısa ömürlü, 404 olabilir) |
| `/api/v1/instant?format=mp4&kalite=360` | GET | ❌ **`durum:hata` → "Sunucu mp3 yerine HTML döndürdü (reklam sayfası) - yedek motor gerekli"** |
| `/api/v1/link?format=mp4&kalite=720` | GET | ⚠️ `p.savenow.to` linki dönüyor ama doğrulanamadı |

**Çıkarım:** MP3 tarafı sağlıklı. **MP4/video tarafı kırık** — üçüncü parti
"link motoru" reklam HTML'i döndürüyor. Sunucu kendi notunda "yedek motor gerekli"
diyor. Bu, aradığın "çalışır video servisi" probleminin tam olarak nedeni.

### Verdiğin `rnd_…` anahtarı hakkında önemli not

`rnd_TOkW…` biçimli bu değer, **mp3-apisi'nin API key'i değil**; bir
**Render platform API anahtarıdır** (`rnd_` öneki Render hesap anahtarıdır).
mp3-apisi'ne `?key=rnd_…` ile sorulduğunda şu cevabı verdi:

```
{"hata":"Geçersiz API key — ana sayfadan kendi key'ini oluştur (?key=...)","ok":false}
```

Yani bu anahtarla **indirme yapılmaz**; Render hesabında servis oluşturmak/yönetmek
için kullanılır. Sandbox `api.render.com`'a doğrudan erişemediği için anahtarın
geçerliliğini burada doğrulayamadım.

> 🔐 **Güvenlik:** Bu anahtar sohbette açıkça paylaşıldı. Render Dashboard →
> Account Settings → API Keys kısmından **iptal edip yenileyin (rotate)**. Ayrıca
> repoda hâlihazırda kaynak koda gömülü başka anahtarlar var
> (`sk-71c6…` sayfada, `f890c1…` RapidAPI anahtarı `youtube-media/[...path]` içinde,
> Pinterest/Twitter route'larında). Bunlar herkese açık repoda oldukları için
> sızmış kabul edilmeli ve ortam değişkenine taşınmalı.

---

## 2. "Korumasız" (anahtarsız) açık servisler

Cobalt açık kaynak bir indirici; topluluk instance'larını
[cobalt.directory](https://cobalt.directory/) 10 dakikada bir tarayıp hangi
servisin çalıştığını raporluyor. 2026-10-24 03:43 UTC anlık görüntüsü:

| Instance | API | Sürüm | Turnstile | YouTube | Skor |
|----------|-----|-------|-----------|---------|------|
| cobalt.xenon.zone | `https://rue-cobalt.xenon.zone` | 11.7.1 | ❌ yok | ✅ Working | 75% (18/24) |
| cobalt.cjs.nz | `https://cobaltapi.cjs.nz` | 11.5 | ❌ yok | ❌ `error.api.youtube.login` | 54% |
| cobalt.meowing.de | `eulogy-c.meowing.de` | 11.7.1 | ✅ var | ✅ | 100% |
| resmî cobalt.tools | `sunny.imput.net` | 11.7.1 | ✅ var | ❌ **listedeki servislerde youtube yok** | 63% |

**En iyi korumasız aday: `https://rue-cobalt.xenon.zone`**
Doğrudan `GET /` cevabı (canlı):
```json
{"cobalt":{"version":"11.7.1","url":"https://rue-cobalt.xenon.zone/",
"services":["...","youtube"]},"git":{"remote":"imputnet/cobalt"}}
```
`cobalt.directory/instance/7d3bc56033` sayfasında YouTube, YouTube Shorts ve
YouTube Music satırları ✅ işaretli.

### ⚠️ Etik/operasyonel uyarı (Cobalt'ın kendi dokümanından)

Cobalt API dokümanı aynen diyor:

> "hosted api instances (such as `api.cobalt.tools`) use bot protection and are
> **not** intended to be used in other projects without explicit permission."
> — https://github.com/imputnet/cobalt/blob/main/docs/api.md

Yani bir topluluk instance'ını üretim uygulamanıza **sabit kodlamak** hem
kırılgandır (instance bir gecede kapanır) hem de topluluk kaynağını suistimal
eder. **Doğru yol: kendi instance'ını kurmak** (bkz. §5 `render.yaml`). Korumasız
instance'ları sadece test/karşılaştırma için kullan.

### Diğer açık servisler — neden elendiler

- **`btch-downloader-api`** (`boy-offi9-inc/btch-downloader-api`, Ağu 2026'da açılmış,
  no-auth, 20 platform, canlı Vercel demosu var). `/api/health` → `ok`, fakat
  `/api/health?deep=1` → **`status: degraded`, "Upstream probe timed out" (8 sn)**.
  `/api/download/youtube` uçu zaman aşımına düştü. Kendi Issue #1'i ve upstream
  `hostinger-bot/btch-downloader` Issue #147'si **"YouTube Features are dead"**
  (Eyl 2026) diyor. → **Çalışmıyor.**
- **Invidious public API**: `inv.nadeko.net` → "Endpoint disabled",
  `yewtu.be` → 403, `invidious.nerdvpn.de` → 401, `invidious.f5.si` → 530.
  `api.invidious.io/instances.json` listesindeki çoğu instance `api:false`.
- **Piped public API**: `pipedapi.leptons.xyz` → 502, `pipedapi.adminforge.de` → 403,
  `pipedapi.kavin.rocks` → erişilemedi.
- **Resmî `api.cobalt.tools/`** → v11.7.1 ayakta ama `services` dizisinde
  **YouTube yok** (2025 ortasından beri ana instance'ta kapalı).

---

## 3. Yeni GitHub projeleri (2026)

Self-host edilebilir, yt-dlp tabanlı, aktif projeler — "korumasız" ihtiyacının
sürdürülebilir cevabı bunlar:

| Repo | Yıldız | Son güncelleme | Öne çıkan |
|------|--------|----------------|-----------|
| [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | ~200k | 2026-10-21 (sürüm 2026.10.21) | Altın standart. Artık `yt-dlp-ejs` + JS runtime (deno/node) gerektiriyor |
| [imputnet/cobalt](https://github.com/imputnet/cobalt) | ~45k | 2026 | REST API, tunnel/redirect, AGPL-3.0 |
| [fvadicamo/yt-dlp-api](https://github.com/fvadicamo/yt-dlp-api) | yeni | 2026 | FastAPI + Docker, API key, webhook, transcript, job queue |
| [NSKWeb/yt-downloader](https://github.com/NSKWeb/yt-downloader) | yeni | 2026 | FastAPI + aria2c + Redis/ARQ + WebSocket, URL allowlist, rate limit |
| [pabrax/snapLoad-API](https://github.com/pabrax/snapLoad-API) | yeni | 2026 | FastAPI + yt-dlp + spotdl, job takibi |
| [MohammadKobirShah/DLHUB](https://github.com/MohammadKobirShah/DLHUB) | yeni | 2026 | FastAPI + PostgreSQL + Redis, SSRF koruması, Swagger |
| [initred/youtube-downloader](https://github.com/initred/youtube-downloader) | yeni | 2026 | **Next.js + yt-dlp** — bu projeye en yakın mimari |
| [alexta69/metube](https://github.com/alexta69/metube) | — | 2026-09 | Docker, web UI, playlist/kanal aboneliği |
| [coah80/yoink](https://github.com/coah80/yoink) | — | 2026 | Go + Svelte, yt-dlp + ffmpeg |

**Not:** yt-dlp 2026.10.21 PyPI'den sorunsuz kuruldu (sandbox'ta doğrulandı).
Ancak sandbox'tan `youtube.com`'a TLS bağlantısı koptuğu için gerçek extract testi
burada yapılamadı; Render/Vercel gibi çıkış IP'si olan bir sunucuda çalışır.
Ayrıca unutma: yt-dlp'nin tam YouTube desteği için artık **`yt-dlp-ejs` + bir JS
runtime (deno öneriliyor)** gerekir — Docker imajına ekle.

---

## 4. Ücretli / yönetilen yedekler

| Servis | Endpoint | Ücretsiz | Not |
|--------|----------|----------|-----|
| [RenderIO](https://renderio.dev/youtube-video-api/) | `POST /api/v1/ytdlp-download` (`X-API-KEY`) | Çelişkili: landing "100 fetches/mo free", pricing "no permanent free tier, $12/mo" | PO token / SABR / geo engellerini onlar yönetiyor |
| [Apify](https://apify.com/johnvc/youtube-download-api) | Actor run | Deneme | 200 URL/run, 144p–2160p |
| [VidKraken](https://vidkraken.com/) | `POST /api/v2/download` + poll | Deneme | async job |
| RapidAPI (mevcut) | ytstream / youtube-mp36 | Kota | Repoda zaten entegre, key rotation var |

Bunlar "PO token / bot doğrulama" yükünü üstlenir; maliyet karşılığında en az
bakım gerektiren seçeneklerdir.

---

## 5. Tavsiye edilen mimari

```
[OttiTok /api/youtube]
   1) RapidAPI ytstream + youtube-mp36   (mevcut, key rotation)
   2) mp3-apisi  /api/v1/instant         (MP3 için — çalışıyor)
   3) KENDİ Cobalt instance'ın  POST /   (MP4/video için — render.yaml)
   4) Ücretli yedek (RenderIO/Apify)     (opsiyonel)
```

Neden kendi Cobalt'ın:
- **Korumasız** çalıştırabilirsin (`API_AUTH_REQUIRED` ayarlanmazsa anahtar gerekmez)
  ya da tek bir API key ile korursun — kontrol sende.
- YouTube, TikTok, Instagram, Twitter, SoundCloud… 24 servis tek API.
- Yanıt şeması temiz: `tunnel | redirect | picker | local-processing | error`.
- `rnd_…` Render anahtarınla Blueprint olarak tek tıkla kurulur.

Bu repoda eklenenler:
- `render.yaml` — Cobalt v11 için Render Blueprint (sağlık kontrolü + limitler).
- `src/app/api/youtube/route.ts` — `COBALT_API_URL` tanımlıysa devreye giren,
  RapidAPI başarısız olduğunda Cobalt'a düşen **env-tabanlı yedek**. Varsayılan
  olarak kapalı; hiçbir topluluk instance'ı sabit kodlanmadı.
- `scripts/test-download-apis.mjs` — tüm adayları canlı test eden araç.

### Kurulum (3 adım)

```bash
# 1) Render Dashboard → New → Blueprint → bu repoyu seç (render.yaml okunur)
#    API_URL sorulacak → https://<servis-adın>.onrender.com  yaz
#    (rnd_… anahtarını yalnızca Render arayüzünde / GitHub Actions secret olarak kullan)

# 2) Vercel / .env.local içine kendi instance'ının adresini gir
COBALT_API_URL=https://<servis-adın>.onrender.com
# opsiyonel, instance'ı koruduysan:
COBALT_API_KEY=<uuid-v4>

# 3) Kendi makinende her şeyi test et
node scripts/test-download-apis.mjs
```

---

## 6. ⚠️ Zararlı yazılım uyarısı

[`sparkdustscheme/Youtube-Music-API-Downloader`](https://github.com/sparkdustscheme/Youtube-Music-API-Downloader)
reposu **kesinlikle indirilmemeli**. Tespit edilen kırmızı bayraklar:

- Repo test sırasında **1 saat önce** oluşturulmuş, 132 commit'in tamamı "Initial commit".
- Release notunda **`DOWNLOAD LATEST RELEASE PASSWORD: 2026`** — şifre korumalı arşiv,
  antivirüs taramasını atlatmak için klasik yöntem.
- 2 yıldızına rağmen README'de **"downloads 10.0k"** badge'i (sahte popülerlik).
- 20+ alakasız konu etiketiyle (vanced, adfree, youtube-premium-2026…) arama sıralaması
  manipülasyonu.
- "Vanced client", ".exe arşivi", `README.txt`'e göre kurulum talimatı.

Bu kalıp, ASEC / Microsoft / Checkmarx'ın belgelediği **GitHub üzerinden proxyware +
infostealer dağıtım kampanyasıyla** birebir örtüşüyor (ör. `QuickScreenRecoder.exe`,
PowerShell + Node.js + görev zamanlayıcı ile kalıcılık). Kendi sunucuna/kimliğine
bulaştırmamak için bu tarz "bedava YouTube Downloader + şifreli release" repositorilerinden
uzak dur. Kaynak kodunu oku, çalıştırma.

---

## 7. Test yöntemi ve tekrarlanabilirlik

- Tarih: 2026-10-24, ~03:35–03:45 UTC.
- Sandbox `fetch` yalnızca izinli hostlara (github.com, pypi.org …) çıkabildiği için
  dış servisler HTTP-okuyucu ile GET/POST yapılarak doğrulandı; ağ engeli nedeniyle
  **gerçek MP4/MP3 ikili indirmesi ve Cobalt `POST /` uçtan uca testi sandbox'ta
  yapılamadı**. Bu yüzden `scripts/test-download-apis.mjs` sağlanmıştır — kendi
  makinende çalıştırıp kesin sonucu al.
- Referanslar:
  - Cobalt API dokümanı: https://github.com/imputnet/cobalt/blob/main/docs/api.md
  - Cobalt env değişkenleri: https://github.com/imputnet/cobalt/blob/main/docs/api-env-variables.md
  - Instance koruma: https://github.com/imputnet/cobalt/blob/main/docs/protect-an-instance.md
  - Instance durumları: https://cobalt.directory/
  - yt-dlp: https://github.com/yt-dlp/yt-dlp (sürüm 2026.10.21)
  - btch YouTube hatası: https://github.com/hostinger-bot/btch-downloader/issues/147

---

## Yasal Uyarı

Bu araştırma yalnızca eğitim ve kişisel kullanım amaçlıdır. YouTube ve diğer
platformların hizmet koşulları, indirilen içeriklerin telif hakları ve olası hukuki
sorumluluk kullanıcıya aittir. Üçüncü parti topluluk servislerini kullanırken
ilgili instance sahiplerinin kullanım koşullarına uyulmalıdır.
