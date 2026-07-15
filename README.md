# OttiTok — Evrensel Sosyal Medya İndirici & Araç Kutusu 🚀

Modern, reklamsız ve çok işlevli bir web uygulaması. Next.js (App Router) ile geliştirilmiş, Glassmorphism tasarımıyla premium kullanıcı deneyimi sunar.

---

## Özellikler ✨

### Sosyal Medya İndiricileri

- **TikTok İndirici**
  - Filigransız MP4 video indirme
  - Fotoğraf slayt (carousel) desteği — ızgara görünümü + toplu indirme
  - Ses indirme (MP3)

- **YouTube İndirici**
  - Video ve Shorts indirme (144p – 2160p)
  - Birleşik sesli format (360p) + ayrı yüksek kalite video formatları
  - MP3 ses indirme (youtube-mp36 API)

- **Instagram İndirici**
  - Reels video indirme
  - Tekil ve çoklu fotoğraf (carousel) indirme

- **Pinterest İndirici**
  - Tekil Pin indirme (fotoğraf & video)
  - Profil sayfası listeleme & toplu indirme
  - `pin.it` kısa link desteği
  - İçerik üreticisi (Creator) algılama

- **Twitter/X İndirici**
  - Tweet videoları ve GIF'leri indirme
  - Bitrate tabanlı kalite sıralaması (1080p, 720p, 480p...)
  - 3 katmanlı yedekli sistem: RapidAPI → Syndication API → FxTwitter

### Araç Kutusu

- **Görsel Dönüştürücü**
  - JPG, PNG, WebP, AVIF formatları arası dönüştürme
  - Kalite kaydırıcısı (1–100)
  - Genişlik/yükseklik yeniden boyutlandırma (oran koruma destekli)
  - Önizleme karşılaştırması + boyut tasarrufu istatistiği

- **Renk Paleti**
  - HEX / RGB / HSL dönüştürme — gerçek zamanlı senkronizasyon
  - Native color picker
  - 8 ton (shade) üretimi — tıkla kopyala
  - 4 renk uyumu: Tamamlayıcı, Üçlü, Analog, Ayrık Tamamlayıcı
  - CSS değerleri & Tailwind sınıfı çıktısı — satıra tıkla kopyala

- **QR Kod Oluşturucu**
  - 5 içerik tipi: URL, Metin, WiFi, E-posta, Telefon
  - Özel renk ve arka plan seçimi
  - Boyut ayarı (128–512px) ve hata düzeltme seviyesi (L/M/Q/H)
  - PNG ve SVG olarak indirme
  - Canlı önizleme

- **Ses Dönüştürücü**
  - MP3, WAV, OGG, AAC, FLAC formatları
  - Tamamen tarayıcıda çalışır — ffmpeg.wasm (sunucuya dosya gitmez)
  - Bitrate seçimi (64–320 kbps)
  - İlerleme çubuğu + audio player önizleme
  - Boyut karşılaştırma istatistiği

- **AI Playlist Oluşturucu** *(Gemini 2.5 Flash)*
  - Serbest metin ile playlist talebi: "hüzünlü Türkçe şarkılar", "egzersiz müziği" vb.
  - Gemini'nin düşünce süreci **canlı olarak** ekrana akar (streaming)
  - Her şarkı otomatik olarak YouTube'da aranır
  - Tek tek MP3 indirme veya tüm playlist ZIP olarak indirme
  - 8 hazır duygu/tema şablonu

### Sistem Özellikleri

- **API Key Rotation** — Instagram, Pinterest, Twitter, YouTube ve Gemini için çoklu key rotasyonu
- **Force-Download Proxy** — medyalar yeni sekmede açılmaz, direkt indirilir
- **Deep Linking** — platform logolarına tıklayınca mobil uygulamayı açar
- **Mobil Uyumlu** — responsive tasarım

---

## Kullanılan Teknolojiler

| Kategori | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Glassmorphism CSS |
| AI | Google Gemini 2.5 Flash |
| Görsel işleme | sharp |
| Ses işleme | ffmpeg.wasm (@ffmpeg/ffmpeg) |
| QR | qrcode |
| ZIP | jszip |
| API | RapidAPI (ytstream, youtube-mp36, instagram-reels-downloader, pinterest, twitter) |

---

## Kurulum

```bash
git clone https://github.com/kcbyk/ottiktok.git
cd ottiktok
npm install
```

`.env.local` dosyası oluştur:

```env
RAPIDAPI_KEYS=key1,key2,key3,key4,key5
GEMINI_KEYS=gemini_key1,gemini_key2,...
```

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresi.

---

## Yasal Uyarı ⚠️

Bu uygulama yalnızca eğitim ve kişisel araştırma amacıyla geliştirilmiştir. İndirilen içeriklerin telif hakları ilgili içerik üreticilerine aittir. Bu aracın kullanımından doğabilecek her türlü hukuki sorumluluk kullanıcıya aittir.
