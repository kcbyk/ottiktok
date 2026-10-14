/**
 * TikTok / Douyin bağlantı yardımcıları
 * ─────────────────────────────────────────────────────────────────────────────
 * NEDEN BU DOSYA VAR?
 * TikTok, paylaşım linklerinde sürekli yeni domain'ler kullanıyor. Eskiden
 * sadece vm.tiktok.com vardı, sonra vt.tiktok.com geldi, 2025 sonundan
 * itibaren uygulama artık `https://www.tt.site/t/<kod>` formatında link
 * üretiyor. Domain kontrolünü tek bir yerde (burada) toplamazsak her yeni
 * domain'de "Lütfen geçerli bir TikTok linki yapıştırın." hatası tekrar eder.
 *
 * YENİ BİR DOMAIN ÇIKARSA yapılacak tek şey: aşağıdaki TIKTOK_ROOT_DOMAINS
 * listesine kök domain'i eklemek. Alt domain'ler (www., m., vt., vm., v.,
 * lite. vb.) otomatik kabul edilir, ayrıca tek tek yazılmaları gerekmez.
 *
 * NOT: Liste "includes()" ile DEĞİL, hostname'in kendisiyle karşılaştırılır.
 * Böylece `sahte-tiktok.com` veya `tiktok.com.evil-site.com` gibi taklit
 * domain'ler kabul edilmez.
 */

/**
 * Kabul edilen kök domain'ler (alt domain'leriyle birlikte):
 *
 *  - tiktok.com     → www.tiktok.com, m.tiktok.com, vt.tiktok.com,
 *                     vm.tiktok.com, lite.tiktok.com, t.tiktok.com,
 *                     www.tiktok.com/t/<kod> (yeni kısa format) …
 *  - tt.site        → www.tt.site/t/<kod> — TikTok uygulamasının 2025+
 *                     ürettiği YENİ paylaşım domain'i. tiktok.com'a
 *                     301 ile yönlenir (x-tt-logid başlığı TikTok'a ait).
 *  - douyin.com     → www.douyin.com, v.douyin.com, vt.douyin.com …
 *                     (TikTok'un Çin sürümü)
 *  - iesdouyin.com  → www.iesdouyin.com/share/video/<id> (Douyin paylaşım)
 *  - amemv.com      → v.amemv.com, webcast.amemv.com (eski Douyin kısa linki)
 *  - snssdk.com     → aweme.snssdk.com vb. (Douyin/Aweme paylaşım linkleri)
 *  - musical.ly     → vm.musical.ly, www.musical.ly (TikTok'un eski adı;
 *                     eski linkler hâlâ tiktok.com'a yönleniyor)
 *  - tiktokv.com    → www.tiktokv.com/share/video/<id>, /embed/<id>
 *                     (yt-dlp'nin de kabul ettiği resmi paylaşım formatı)
 */
export const TIKTOK_ROOT_DOMAINS = [
  "tiktok.com",
  "tt.site",
  "douyin.com",
  "iesdouyin.com",
  "amemv.com",
  "snssdk.com",
  "musical.ly",
  "tiktokv.com",
] as const;

/** TikWM'in doğrudan anlayamadığı, önce yönlendirmesi çözülmesi gereken kısa link host'ları */
const SHORT_LINK_HOSTS = new Set([
  "tt.site",
  "www.tt.site",
  "vm.tiktok.com",
  "vt.tiktok.com",
  "v.douyin.com",
  "vt.douyin.com",
  "vm.musical.ly",
  "v.amemv.com",
]);

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

/** Bir hostname TikTok/Douyin domain'lerinden biri mi? (alt domain'ler dahil) */
export function isTikTokHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return TIKTOK_ROOT_DOMAINS.some(
    (root) => host === root || host.endsWith(`.${root}`)
  );
}

/**
 * Kullanıcının yapıştırdığı metinden TikTok linkini çıkarır.
 * Uygulamadan kopyalanan metin çoğu zaman saf link değildir:
 *   "Bu videoya bak! https://www.tt.site/t/ZSgJgdB2r/ #fyp"
 *   "www.tiktok.com/@user/video/123..." (https:// olmadan)
 * İkisini de bulur, sondaki noktalama işaretlerini temizler.
 * Bulamazsa null döner. Sadece rakamdan oluşan video ID'si de kabul edilir.
 */
export function extractTikTokUrl(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const text = input.trim();
  if (!text) return null;

  // Sadece video ID'si yapıştırılmışsa kanonik linke çevir
  if (/^\d{17,19}$/.test(text)) {
    return `https://www.tiktok.com/@a/video/${text}`;
  }

  // 1) https?:// ile başlayan ilk URL
  let candidate = text.match(/https?:\/\/[^\s<>"'`)\]]+/i)?.[0] ?? null;

  // 2) Şemasız yazılmış domain (örn. "www.tt.site/t/XYZ" veya "vt.tiktok.com/XYZ")
  if (!candidate) {
    const roots = TIKTOK_ROOT_DOMAINS.map((d) => d.replace(/\./g, "\\.")).join("|");
    candidate =
      text.match(new RegExp(`(?:[a-z0-9-]+\\.)*(?:${roots})(?:\\/[^\\s<>"'\`)\\]]*)?`, "i"))?.[0] ??
      null;
  }

  if (!candidate) return null;

  // Sona yapışmış noktalama / parantez kalıntılarını at
  candidate = candidate.replace(/[.,;!?…]+$/, "");
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

/** Bir URL (string veya URL nesnesi) TikTok/Douyin linki mi? */
export function isTikTokUrl(value: string | URL): boolean {
  try {
    const url = typeof value === "string" ? new URL(value) : value;
    return isTikTokHostname(url.hostname);
  } catch {
    return false;
  }
}

/**
 * URL'den video/fotoğraf ID'sini çıkarır.
 * Desteklenen desenler:
 *   /@kullanici/video/<id>   /@kullanici/photo/<id>   /video/<id>
 *   /photo/<id>  /note/<id>   /v/<id>   /share/video/<id>  /embed/<id>
 *   ?item_id=<id> &aweme_id=<id> … ve son çare olarak yoldaki 17-19 haneli sayı
 */
export function extractTikTokVideoId(value: string | URL): string | null {
  try {
    const url = typeof value === "string" ? new URL(value) : value;

    const pathMatch = url.pathname.match(
      /\/(?:video|photo|note|v|share\/video|share\/photo|embed)\/(\d{10,})/i
    );
    if (pathMatch) return pathMatch[1];

    for (const key of ["item_id", "aweme_id", "video_id", "id"]) {
      const param = url.searchParams.get(key);
      if (param && /^\d{10,}$/.test(param)) return param;
    }

    const generic = url.pathname.match(/(\d{17,19})/);
    return generic ? generic[1] : null;
  } catch {
    const generic = String(value).match(
      /\/(?:video|photo|note|v|share\/video|share\/photo|embed)\/(\d{10,})/i
    );
    return generic ? generic[1] : null;
  }
}

/**
 * Bu link kısa link mi / ID'si URL'nin içinde açıkça yok mu?
 * Öyleyse TikWM'e göndermeden ÖNCE yönlendirmesi çözülmelidir —
 * TikWM, tt.site gibi yeni domain'leri tanımayıp
 * "Url parsing is failed!" hatası veriyor.
 */
export function isShortTikTokLink(value: string | URL): boolean {
  try {
    const url = typeof value === "string" ? new URL(value) : value;
    const host = normalizeHostname(url.hostname);
    if (SHORT_LINK_HOSTS.has(host)) return true;
    // İçinde açıkça video ID'si olan linklerin (örn.
    // iesdouyin.com/share/video/<id>) çözülmesine gerek yok,
    // TikWM onları doğrudan anlıyor.
    if (extractTikTokVideoId(url) !== null) return false;
    // tiktok.com/t/<kod> gibi kodlu kısa yollar
    if (/^\/(t|share)\/[\w-]+/i.test(url.pathname)) return true;
    // İçinde video ID'si olmayan her TikTok linkinin çözülmesi gerekir
    return true;
  } catch {
    return false;
  }
}

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

/**
 * Kısa linkin yönlendirmesini takip edip nihai (kanonik) URL'yi döndürür.
 * Örn. https://www.tt.site/t/ZSgJgdB2r/
 *   → https://www.tiktok.com/@thelchavo1/video/7680247446194162951?_r=1&_t=...
 *
 * TikTok son sayfada botlara 403 verse bile fetch'in `url` alanı
 * yönlenilen son adresi taşır; bize gereken de zaten o adresteki ID.
 * Çözülemezse null döner.
 */
export async function resolveTikTokUrl(value: string): Promise<string | null> {
  try {
    // Önce HEAD dene (gövde indirmeden, hızlı). Bazı sunucular HEAD'i
    // reddederse GET'e düş.
    for (const method of ["HEAD", "GET"] as const) {
      try {
        const res = await fetch(value, {
          method,
          redirect: "follow",
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": MOBILE_UA, Accept: "text/html,*/*" },
        });
        const finalUrl = res.url;
        // Gövdeyi tüket ki bağlantı asılı kalmasın
        res.body?.cancel().catch(() => {});
        if (finalUrl && finalUrl !== value && isTikTokUrl(finalUrl)) {
          return finalUrl;
        }
        if (method === "GET" && finalUrl && isTikTokUrl(finalUrl)) {
          return finalUrl;
        }
      } catch {
        // sıradaki yöntemi dene
      }
    }
  } catch {
    // sessizce vazgeç, çağıran taraf orijinal linkle devam eder
  }
  return null;
}

/** Video ID'sinden TikWM'in her zaman kabul ettiği kanonik linki üretir. */
export function canonicalTikTokUrl(videoId: string, source?: string | URL): string {
  // Douyin kaynağında Douyin kanoniği, diğer her şeyde TikTok kanoniği kullan
  try {
    const host = source
      ? normalizeHostname(new URL(String(source)).hostname)
      : "";
    if (host === "douyin.com" || host.endsWith(".douyin.com") || host.endsWith("iesdouyin.com")) {
      return `https://www.douyin.com/video/${videoId}`;
    }
  } catch {
    // yok say
  }
  return `https://www.tiktok.com/@a/video/${videoId}`;
}
