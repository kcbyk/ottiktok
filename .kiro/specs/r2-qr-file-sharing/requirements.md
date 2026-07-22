# Requirements Document

## Introduction

Bu özellik, ottiktok uygulamasına Cloudflare R2 depolama entegrasyonu ve QR kod tabanlı dosya paylaşımı ekler. Mevcut Dropbox entegrasyonu büyük dosyalar için yetersiz kaldığından, Cloudflare R2 ikincil (büyük dosyalar için birincil) depolama katmanı olarak eklenmektedir. Kullanıcılar video, MP3, PDF, ZIP gibi her türlü dosyayı R2'ye yükleyebilir; sistem bu dosyalar için otomatik olarak bir `/file/[id]` sayfası linki ve QR kod üretir. Alıcılar QR kodu okuyarak dosyayı indirebilir.

## Glossary

- **R2_Uploader**: Cloudflare R2 bucket'ına (`ottiktok-files`) dosya yükleyen API bileşeni (`/api/r2-upload`).
- **R2_Public_URL**: Cloudflare R2 public erişim adresi: `https://pub-f0666a218521401bbfb12857551a4628.r2.dev`.
- **File_Page**: Mevcut `/file/[id]` sayfası; `url`, `fn` (dosya adı) ve `type` (MIME type) query parametreleri ile çalışır, dosyayı oynatır veya indirir.
- **QR_Generator**: `qrcode` kütüphanesi aracılığıyla URL'den QR kod görüntüsü üreten bileşen.
- **Share_Link**: R2'ye yüklenen dosyaya ait `/file/[id]` sayfasının tam URL'i; `url`, `fn` ve `type` parametrelerini içerir.
- **R2_Credentials**: Cloudflare R2 erişimi için gereken `CF_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` ortam değişkenleri.
- **File_Key**: R2 bucket'ında dosyayı benzersiz biçimde tanımlayan anahtar; `{timestamp}_{sanitized_filename}` formatındadır; burada `sanitized_filename`, orijinal dosya adındaki boşlukların `_` ile değiştirilmesi ve `[a-zA-Z0-9._-]` dışındaki karakterlerin kaldırılmasıyla elde edilir.
- **Upload_Page**: Kullanıcının dosya seçip R2'ye yüklediği ve QR kodu aldığı yeni UI sayfası (`/r2-upload`).
- **MIME_Type**: Dosyanın içerik türü (örn. `video/mp4`, `audio/mpeg`, `application/pdf`).

## Requirements

### Requirement 1: R2 Upload API

**User Story:** Bir kullanıcı olarak, herhangi bir dosyayı Cloudflare R2'ye yükleyip doğrudan indirilebilir bir public URL almak istiyorum; böylece Dropbox'ın dosya boyutu kısıtlamalarından etkilenmeden büyük dosyaları paylaşabilirim.

#### Acceptance Criteria

1. WHEN bir `multipart/form-data` POST isteği `/api/r2-upload` endpoint'ine `file` alanı ile gönderildiğinde, THE R2_Uploader SHALL dosyayı Cloudflare R2 bucket'ına (`ottiktok-files`) yükler.
2. WHEN R2_Uploader bir dosya yüklendiğinde, THE R2_Uploader SHALL `{timestamp}_{sanitized_filename}` formatında benzersiz bir File_Key üretir; burada `sanitized_filename`, orijinal dosya adındaki boşlukların `_` ile değiştirilmesi ve `[a-zA-Z0-9._-]` dışındaki karakterlerin kaldırılmasıyla oluşturulur; ve bu anahtarla dosyayı depolar.
3. WHEN yükleme başarıyla tamamlandığında, THE R2_Uploader SHALL JSON yanıtında `{ url, key, filename, mimeType }` alanlarını döner; burada `url`, `{R2_PUBLIC_URL}/{File_Key}` formatında `R2_PUBLIC_URL` ortam değişkeninden okunarak oluşturulan tam erişim adresidir.
4. IF R2_Credentials ortam değişkenlerinden herhangi biri (`CF_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) tanımsız veya boş ise, THEN THE R2_Uploader SHALL HTTP 503 durum kodu ile `{ error: 'R2 yapılandırılmamış' }` yanıtı döner.
5. IF yükleme isteğinde `file` alanı yoksa veya dosya boyutu 0 byte ise, THEN THE R2_Uploader SHALL HTTP 400 durum kodu ile `{ error: 'Dosya gerekli' }` yanıtı döner.
6. IF Cloudflare R2 API'si bir hata döndürürse, THEN THE R2_Uploader SHALL HTTP 502 durum kodu ile `{ error: 'Yükleme başarısız' }` yanıtı döner.
7. THE R2_Uploader SHALL `@aws-sdk/client-s3` paketi ile S3-uyumlu Cloudflare R2 API'sini kullanarak yükleme yapar; endpoint olarak `https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com` kullanılır.
8. THE R2_Uploader SHALL tek bir istekte maksimum 500 MB boyutunda dosya kabul eder; bu sınırı aşan istekler için HTTP 413 durum kodu ile `{ error: 'Dosya boyutu 500 MB sınırını aşıyor' }` yanıtı döner.

### Requirement 2: Share Link Oluşturma

**User Story:** Bir kullanıcı olarak, R2'ye yüklenen dosya için otomatik olarak bir `/file/[id]` paylaşım linki oluşturulmasını istiyorum; böylece bu linki QR koda dönüştürüp başkalarıyla paylaşabilirim.

#### Acceptance Criteria

1. WHEN R2 yüklemesi başarıyla tamamlandığında, THE R2_Uploader SHALL `url`, `fn` ve `type` query parametrelerini içeren bir Share_Link döner; bu link `{site_origin}/file/{File_Key}?url={encoded_r2_url}&fn={encoded_filename}&type={encoded_mimeType}` formatındadır; burada `site_origin`, isteğin geldiği HTTP host'undan (`Origin` veya `Host` başlığından) türetilir.
2. THE R2_Uploader SHALL Share_Link içindeki `url`, `fn` ve `type` parametrelerini `encodeURIComponent` ile URL-encode eder.
3. WHEN Share_Link bir tarayıcıda açıldığında ve `type` parametresi `audio/*` veya `video/*` ile eşleşiyorsa, THE File_Page SHALL inline oynatıcı (audio/video HTML elementi) ile medyayı oynatır.
4. WHEN Share_Link bir tarayıcıda açıldığında ve `type` parametresi `audio/*` veya `video/*` ile eşleşmiyorsa, THE File_Page SHALL "İndir" butonu sunar ve tarayıcı indirme mekanizmasını tetikler.

### Requirement 3: QR Kod Üretimi

**User Story:** Bir kullanıcı olarak, R2'ye yüklenen dosyanın Share_Link'inden anında bir QR kod görmek istiyorum; böylece başkaları bu QR kodu okuyarak dosyayı indirebilsin.

#### Acceptance Criteria

1. WHEN Share_Link oluşturulduğunda, THE QR_Generator SHALL `qrcode` kütüphanesi kullanarak Share_Link'ten bir PNG QR kodu üretir ve Upload_Page üzerinde `<img>` elementi olarak görüntüler.
2. THE QR_Generator SHALL QR kodunu en az 300×300 piksel boyutunda üretir.
3. THE QR_Generator SHALL H (yüksek) hata düzeltme seviyesi ile QR kodu oluşturur; böylece kısmen hasar görmüş QR kodlar da okunabilir kalır.
4. WHEN kullanıcı "QR İndir" butonuna tıkladığında, THE QR_Generator SHALL QR kodunu `{fn}-qr.png` adıyla (burada `{fn}` yüklenen dosyanın adıdır) tarayıcı indirme mekanizması ile kaydeder.
5. IF QR_Generator bir hata ile karşılaşırsa, THEN THE Upload_Page SHALL kullanıcıya "QR kodu oluşturulamadı" hata mesajını gösterir ve Share_Link'i kopyalama butonu görünür kalmaya devam eder.
6. WHERE Share_Link mevcut değilse, THE "QR İndir" butonu SHALL devre dışı (disabled) durumda kalır.

### Requirement 4: Upload Sayfası (UI)

**User Story:** Bir kullanıcı olarak, dosya seçip R2'ye yükleyebileceğim ve anında QR kodu görebileceğim bir sayfa istiyorum; böylece tüm işlemi tek bir ekrandan tamamlayabileyim.

#### Acceptance Criteria

1. THE Upload_Page SHALL `/r2-upload` rotasında erişilebilir olur ve mevcut uygulama navigasyonuna eklenir.
2. WHEN kullanıcı bir dosya seçtiğinde, THE Upload_Page SHALL dosya adını, boyutunu (MB cinsinden, 2 ondalık basamak) ve MIME_Type'ını önizleme olarak gösterir.
3. WHEN kullanıcı "Yükle ve QR Oluştur" butonuna tıkladığında, THE Upload_Page SHALL dosyayı `/api/r2-upload` endpoint'ine gönderir ve yükleme tamamlanana kadar görünür bir spinner veya ilerleme çubuğu görüntüler.
4. WHEN yükleme başarıyla tamamlandığında, THE Upload_Page SHALL Share_Link'i ve üretilen QR kodunu aynı ekranda gösterir.
5. WHEN yükleme başarıyla tamamlandığında, THE Upload_Page SHALL Share_Link'i panoya kopyalayan bir buton sunar; kopyalama işleminin ardından buton en az 2 saniye boyunca "Kopyalandı ✓" durumunu yansıtır.
6. IF yükleme başarısız olursa, THEN THE Upload_Page SHALL kullanıcıya hata mesajını gösterir, "Yükle ve QR Oluştur" butonunu yeniden etkinleştirir ve daha önce seçilmiş dosyayı seçili olarak korur; hata mesajı kullanıcı tarafından kapatılabilir.
7. THE Upload_Page SHALL video, ses (MP3/AAC), PDF, ZIP ve diğer yaygın dosya formatlarını kabul eder; desteklenen MIME type'ları `video/*`, `audio/*`, `application/pdf`, `application/zip`, `application/octet-stream` kapsar.
8. WHEN kullanıcı 500 MB'ı aşan bir dosya seçtiğinde, THE Upload_Page SHALL sunucuya istek göndermeden önce "Dosya 500 MB sınırını aşıyor" hata mesajını gösterir ve yükleme işlemini engeller.

### Requirement 5: Ortam Değişkeni Yapılandırması

**User Story:** Bir geliştirici olarak, R2 kimlik bilgilerini ortam değişkenleri aracılığıyla güvenli biçimde yapılandırabilmek istiyorum; böylece credentials kaynak koduna gömülmez.

#### Acceptance Criteria

1. THE R2_Uploader SHALL R2 erişimi için yalnızca `CF_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` ve `R2_SECRET_ACCESS_KEY` ortam değişkenlerini kullanır; bu değişkenlerin gerçek değerleri hiçbir sürüm kontrolü altındaki kaynak dosyasında açık metin olarak yer almaz.
2. THE R2_Uploader SHALL `R2_BUCKET_NAME` ortam değişkeninden bucket adını okur; bu değer varsayılan olarak `ottiktok-files` olarak ayarlanır.
3. THE R2_Uploader SHALL `R2_PUBLIC_URL` ortam değişkeninden public erişim adresini okur; bu değer varsayılan olarak `https://pub-f0666a218521401bbfb12857551a4628.r2.dev` olarak ayarlanır.
4. IF `CF_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` veya `R2_BUCKET_NAME` ortam değişkenlerinden herhangi biri tanımsız veya boş ise, THEN THE R2_Uploader SHALL hiçbir yükleme işlemi gerçekleştirmez ve hangi değişkenin eksik olduğunu belirten bir hata mesajı ile HTTP 503 döner.

### Requirement 6: Dropbox ile Birlikte Çalışabilirlik

**User Story:** Bir kullanıcı olarak, mevcut Dropbox tabanlı yükleme akışının bozulmadan çalışmaya devam etmesini istiyorum; böylece R2 entegrasyonu mevcut işlevleri etkilemez.

#### Acceptance Criteria

1. THE R2_Uploader SHALL mevcut `/api/dropbox-upload` route dosyasında herhangi bir değişiklik yapmadan, yalnızca yeni `/api/r2-upload` endpoint'i olarak eklenir.
2. WHILE `DROPBOX_ACCESS_TOKEN` ortam değişkeni tanımlı ve geçerliyken, THE `/api/dropbox-upload` endpoint'i SHALL mevcut istek/yanıt davranışını — yükleme, paylaşılabilir link oluşturma ve hata işleme dahil — değiştirmeksizin sürdürür.
3. THE Upload_Page SHALL yalnızca R2 yükleme akışını barındırır; mevcut Dropbox entegrasyonunun kullandığı herhangi bir UI bileşenini, state'i veya API çağrısını değiştirmez.
