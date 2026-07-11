# Ad-Free TikTok, Instagram, Pinterest & Twitter/X Downloader 🚀

Bu proje; TikTok, Instagram, Pinterest ve Twitter/X içeriklerini (videolar, reels, GIF'ler, fotoğraflar, slaytlar, carouseller ve kullanıcı profilleri) **reklamsız**, **güvenli** ve **doğrudan** indirebilmeniz için geliştirilmiş modern ve evrensel bir sosyal medya indirici uygulamasıdır.

Next.js (App Router) kullanılarak geliştirilmiş olup, "Glassmorphism" (buzlu cam efekti) tasarımıyla şık, akıcı ve premium bir kullanıcı deneyimi sunar. Vercel veya benzeri platformlar üzerinden tek tıkla yayınlanmaya (deploy) hazırdır.

## Özellikler ✨

- **Tamamen Reklamsız:** Sinir bozucu açılır pencereler (pop-up) veya gizli reklamlar yok.
- **Akıllı Navigasyon (Menü):** Modern hamburger menü ile TikTok, Instagram, Pinterest ve Twitter/X sayfaları arasında hızlı geçiş.
- **Akıllı Platform Yönlendirmesi (Deep Linking):** Sayfa logolarına tıkladığınızda; telefondaysanız doğrudan o platformun **kendi mobil uygulamasını** açmaya çalışır, yüklü değilse veya bilgisayardaysanız resmi web sitesine yönlendirir.
- **TikTok İndirici:**
  - **Filigransız İndirme:** TikTok videolarını logolar ve yazılar olmadan saf MP4 formatında indirir.
  - **Fotoğraf Slayt Desteği:** Kaydırmalı fotoğraf gönderilerindeki tüm fotoğrafları tespit eder, ızgara (grid) halinde sunar ve yüksek kalitede indirmenize olanak tanır.
  - **Sesi İndirme:** Sadece videonun müziğini (MP3) indirebilme seçeneği.
- **Instagram İndirici:**
  - **Reels İndirme:** Yüksek kaliteli Reels videolarını doğrudan cihazınıza indirir.
  - **Fotoğraf ve Carousel Desteği:** Instagram gönderilerindeki tekil veya çoklu fotoğrafları otomatik olarak ayrıştırarak indirme seçenekleriyle listeler.
- **Pinterest İndirici (Özel Gelişmiş Mod):**
  - **Birleşik Arama Modu:** Yapıştırılan linkin tek bir Pin mi yoksa bir Kullanıcı Profili mi olduğunu otomatik tespit eder.
  - **Kısa Link Desteği (`pin.it`):** Yönlendirmeli kısa linkleri arka planda çözerek hatasız çalışır.
  - **Profil Görünümü & Toplu İndirme:** Bir profile ait tüm pin'leri (resim ve videoları) listeler. Her görselin altında doğrudan indirme seçeneği yer alır.
  - **İçerik Üreticisi (Creator) Algılama:** Videoyu panosuna kaydeden kişi yerine, videonun asıl üreticisini (Creator) bularak onun profiline tek tıkla gitmenizi sağlar.
- **Twitter/X İndirici (Gelişmiş Bitrate Modu):**
  - **Video ve GIF İndirme:** Tweet'lerdeki videoları ve GIF'leri en yüksek çözünürlüklerde indirir.
  - **Bitrate Tabanlı Sıralama:** Çekilen tüm MP4 formatındaki varyasyonları gerçek veri hızı (bitrate) değerlerine göre analiz edip en yüksek kaliteden (1080p, 720p HD) en düşüğe doğru otomatik olarak sıralar.
  - **Çok Aşamalı Hibrit Failover:** Twitter/X API kısıtlamalarına karşı 3 katmanlı yedekli sistem barındırır (RapidAPI Key Rotation -> Twitter Syndication API -> FxTwitter API).
- **Yedekli API Rotasyon Sistemi (Key Rotation):** Pinterest, Instagram ve Twitter için 5 farklı API anahtarı rotasyonda döner. Bir anahtarın limiti dolduğunda sistem otomatik olarak bir sonrakine geçer.
- **Doğrudan Tarayıcı İndirmesi (Force Download):** Medyalar yeni sekmede açılmaz, arka plandaki Proxy API sayesinde doğrudan bilgisayarınıza veya telefonunuza inmeye başlar.
- **Mobil Uyumlu (Responsive):** Telefonlardan ve tabletlerden kusursuz görünüm.

## Nasıl Kullanılır? 📱

1. İndirmek istediğiniz içeriğin **bağlantısını (linkini) kopyalayın**.
2. Sağ üstteki menü ikonuna tıklayıp indirmek istediğiniz platformu seçin.
3. Kopyaladığınız linki arama kutusuna **yapıştırın** ve **"İndir"** butonuna tıklayın.
4. Ekranda beliren indirme seçeneklerini kullanarak medyayı anında cihazınıza kaydedin!

## Yerel Kurulum (Local Development) 🛠️

Projeyi kendi bilgisayarınızda çalıştırmak için:

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/kcbyk/ottiktok.git
   ```
2. Klasöre girin:
   ```bash
   cd ottiktok
   ```
3. Gerekli paketleri yükleyin:
   ```bash
   npm install
   ```
4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
5. Tarayıcınızda `http://localhost:3000` adresini açarak uygulamayı görüntüleyin.

## Yasal Uyarı ve Sorumluluk Reddi ⚠️

**ÖNEMLİ:** Bu uygulama yalnızca eğitim ve kişisel araştırma amacıyla geliştirilmiştir. 

Bu araç kullanılarak sosyal medya platformlarından indirilen ses, video, fotoğraf ve diğer tüm materyallerin **telif hakları ve mülkiyeti tamamen ilgili içerik üreticilerine aittir.** 

İndirilen içeriklerin izinsiz paylaşılması, ticari amaçla kullanılması veya başka platformlarda yeniden yayınlanması yasal ihlallere yol açabilir. **Bu aracın kullanımından doğabilecek her türlü hukuki, cezai ve ahlaki sorumluluk tamamen uygulamanın son kullanıcısına aittir.** Geliştiriciler ve yayıncılar, bu aracın amacı dışında veya kötüye kullanımından dolayı hiçbir mesuliyet ve sorumluluk kabul etmez. Lütfen içerik üreticilerinin haklarına ve platformların kullanım koşullarına saygı gösterin.
