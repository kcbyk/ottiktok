# Design Document

## Overview

Bu tasarım, ottiktok'a Cloudflare R2 depolama katmanını ekler. Mevcut `/file/[id]` sayfası, QR kodu oluşturucu ve okuyucu dokunulmadan kalır; yalnızca iki yeni parça eklenir:

1. **`/api/r2-upload`** — `@aws-sdk/client-s3` kullanan server-side yükleme endpoint'i
2. **`/r2-upload`** — dosya seçip yükleyen ve QR kodu gösteren istemci sayfası

Mevcut `/api/dropbox-upload` route'u ve diğer hiçbir dosya değiştirilmez.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  /r2-upload (Upload_Page)                                   │
│  ┌─────────────────────────────────────────┐                │
│  │  1. Dosya seç (drag-drop veya input)    │                │
│  │  2. "Yükle ve QR Oluştur" butonuna bas  │                │
│  │  3. Spinner göster                      │                │
│  │  4. QR + Share_Link göster              │                │
│  └───────────────┬─────────────────────────┘                │
│                  │ FormData (multipart/form-data)            │
└──────────────────┼──────────────────────────────────────────┘
                   │ POST /api/r2-upload
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                           │
│                                                             │
│  /api/r2-upload/route.ts                                    │
│  ┌─────────────────────────────────────────┐                │
│  │  1. Env var doğrula                     │                │
│  │  2. File_Key üret: {ts}_{clean_name}    │                │
│  │  3. S3Client → PutObjectCommand         │                │
│  │  4. Share_Link oluştur                  │                │
│  │  5. { url, key, filename,               │                │
│  │       mimeType, shareLink } döner       │                │
│  └───────────────┬─────────────────────────┘                │
│                  │ PutObjectCommand                          │
└──────────────────┼──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare R2 (S3-compat)                                  │
│  Bucket: ottiktok-files                                     │
│  Endpoint: https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com │
│  Public URL: https://pub-f0666a218521401bbfb12857551a4628   │
│              .r2.dev/{File_Key}                             │
└─────────────────────────────────────────────────────────────┘
```

**Mevcut dosya indirme akışı (değişmez):**

```
QR okuyucu → /file/[id]?url=...&fn=...&type=...
            ↓
  url = R2 public URL
  fn  = dosya adı
  type = MIME type
            ↓
  video/* → <video> oynatıcı
  audio/* → <audio> oynatıcı
  diğer   → İndir butonu
```

## Components and Interfaces

### 1. `/api/r2-upload/route.ts` (yeni dosya)

```typescript
// Ortam değişkenleri
const CF_ACCOUNT_ID      = process.env.CF_ACCOUNT_ID
const R2_ACCESS_KEY_ID   = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME     = process.env.R2_BUCKET_NAME     || 'ottiktok-files'
const R2_PUBLIC_URL      = process.env.R2_PUBLIC_URL      || 'https://pub-f0666a218521401bbfb12857551a4628.r2.dev'

// S3Client yapılandırması
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// POST handler
export async function POST(req: NextRequest): Promise<NextResponse>

// Başarı yanıtı
interface R2UploadResponse {
  url: string        // R2 public URL: {R2_PUBLIC_URL}/{File_Key}
  key: string        // File_Key: {timestamp}_{sanitized_filename}
  filename: string   // Orijinal dosya adı
  mimeType: string   // Dosya MIME type'ı
  shareLink: string  // /file/{File_Key}?url=...&fn=...&type=...
}

// Hata yanıtı
interface R2ErrorResponse {
  error: string
}
```

**File_Key üretme algoritması:**
```typescript
const sanitized = filename
  .replace(/\s+/g, '_')                   // boşluk → _
  .replace(/[^a-zA-Z0-9._-]/g, '')        // geçersiz karakterleri kaldır
const fileKey = `${Date.now()}_${sanitized}`
```

**Share_Link üretme:**
```typescript
const host     = req.headers.get('host') || 'localhost:3000'
const protocol = host.includes('localhost') ? 'http' : 'https'
const r2Url    = `${R2_PUBLIC_URL}/${fileKey}`
const shareLink = `${protocol}://${host}/file/${fileKey}`
  + `?url=${encodeURIComponent(r2Url)}`
  + `&fn=${encodeURIComponent(filename)}`
  + `&type=${encodeURIComponent(mimeType)}`
```

**HTTP durum kodları:**

| Durum | Açıklama |
|-------|----------|
| 200 | Başarılı yükleme |
| 400 | `file` alanı yok veya 0 byte |
| 413 | Dosya 500 MB sınırını aşıyor |
| 503 | Ortam değişkeni eksik |
| 502 | R2 API hatası |
| 500 | Beklenmeyen hata |

---

### 2. `/r2-upload/page.tsx` (yeni dosya)

**State yapısı:**
```typescript
type UploadState = 'idle' | 'uploading' | 'done' | 'error'

const [file, setFile]           = useState<File | null>(null)
const [state, setState]         = useState<UploadState>('idle')
const [errorMsg, setErrorMsg]   = useState<string>('')
const [shareLink, setShareLink] = useState<string>('')
const [qrDataUrl, setQrDataUrl] = useState<string>('')
const [copied, setCopied]       = useState(false)
```

**Akış:**
1. Kullanıcı dosya seçer → `state = 'idle'`, dosya adı/boyut/MIME gösterilir
2. 500 MB sınırı → istemci tarafında `state = 'error'` anında
3. "Yükle" → `state = 'uploading'`, FormData ile `POST /api/r2-upload`
4. Başarı → `shareLink` set edilir, `qrcode.toDataURL(shareLink, { errorCorrectionLevel: 'H', width: 300 })` çağrılır, `state = 'done'`
5. Hata → `state = 'error'`, hata mesajı gösterilir

**QR kod üretimi (istemci tarafı, `qrcode` zaten kurulu):**
```typescript
const QRCode = (await import('qrcode')).default
const dataUrl = await QRCode.toDataURL(shareLink, {
  width: 300,
  margin: 2,
  errorCorrectionLevel: 'H',
  color: { dark: '#ffffff', light: '#000000' },
})
setQrDataUrl(dataUrl)
```

**QR indirme:**
```typescript
const a = document.createElement('a')
a.href = qrDataUrl
a.download = `${file.name}-qr.png`
a.click()
```

---

### 3. Sidebar güncellemesi (`Sidebar.tsx`)

Mevcut "Dosya → QR" (`/image-to-qr`) öğesinin altına yeni bir öğe eklenir:

```
href: '/r2-upload'
label: 'Dosya Yükle & QR'
desc: 'R2'ye yükle, QR ile paylaş'
gradient: linear-gradient(135deg, #f97316, #ef4444)
```

---

### 4. `.env.local` güncellemesi

Eklenmesi gereken değişkenler (gerçek değerler kullanıcı tarafından doldurulur):
```
CF_ACCOUNT_ID=5f3dcfb5f91ef6e2a71e1f9ba2b7bc59
R2_ACCESS_KEY_ID=<Cloudflare R2 API token access key>
R2_SECRET_ACCESS_KEY=<Cloudflare R2 API token secret>
R2_BUCKET_NAME=ottiktok-files
R2_PUBLIC_URL=https://pub-f0666a218521401bbfb12857551a4628.r2.dev
```

---

### 5. `package.json` bağımlılığı

`@aws-sdk/client-s3` kurulması gerekir:
```bash
npm install @aws-sdk/client-s3
```

## Data Flow

```
Kullanıcı dosya seçer
        │
        ▼
Boyut > 500 MB? ─── Evet ──→ Hata göster (istemci)
        │
       Hayır
        │
        ▼
POST /api/r2-upload
  FormData: { file: File }
        │
        ▼
Env var kontrolü ─── Eksik ──→ 503
        │
      Tamam
        │
        ▼
File_Key = `${Date.now()}_${sanitized}`
        │
        ▼
PutObjectCommand → R2
        │
        ├── Hata ──→ 502
        │
       Başarı
        │
        ▼
r2Url    = R2_PUBLIC_URL + "/" + File_Key
shareLink = origin + "/file/" + File_Key + "?url=...&fn=...&type=..."
        │
        ▼
{ url, key, filename, mimeType, shareLink } döner
        │
        ▼ (istemci)
qrcode.toDataURL(shareLink, { errorCorrectionLevel: 'H' })
        │
        ▼
QR image + copyable link gösterilir
```

## Error Handling

| Senaryo | API yanıtı | UI davranışı |
|---------|-----------|--------------|
| Eksik env var | 503 `R2 yapılandırılmamış` | Kırmızı hata banner |
| Dosya alanı yok | 400 `Dosya gerekli` | Kırmızı hata banner |
| 0 byte dosya | 400 `Dosya gerekli` | Kırmızı hata banner |
| Dosya > 500 MB | istemci engeller | Kırmızı hata banner (API'ye gitmeden) |
| R2 API hatası | 502 `Yükleme başarısız` | Kırmızı hata banner, buton aktif |
| QR oluşturma hatası | — | "QR kodu oluşturulamadı" uyarısı, link kopyalama butonu görünür kalır |

Hata banner'ı kapatılabilir (×). Kapatılınca `state = 'idle'` döner, seçili dosya korunur.

## Dependencies

| Paket | Durum | Kullanım |
|-------|-------|---------|
| `@aws-sdk/client-s3` | **Kurulacak** | R2 yükleme (PutObjectCommand) |
| `qrcode` | Zaten kurulu (v1.5.4) | QR PNG üretimi |
| `@types/qrcode` | Zaten kurulu (v1.5.6) | TypeScript tipleri |
| `next` | Zaten kurulu | API route, App Router |

## File Structure

```
src/
  app/
    api/
      r2-upload/
        route.ts          ← YENİ
    r2-upload/
      page.tsx            ← YENİ
  components/
    Sidebar.tsx           ← GÜNCELLEME (1 yeni nav öğesi)
.env.local                ← GÜNCELLEME (5 yeni değişken)
```

`/api/dropbox-upload/route.ts`, `/file/[id]/page.tsx`, `/qr-code/page.tsx`, `/qr-reader/page.tsx` — hiçbiri değiştirilmez.
