import { NextResponse } from 'next/server';
import {
  extractTikTokUrl,
  extractTikTokVideoId,
  isShortTikTokLink,
  isTikTokUrl,
  resolveTikTokUrl,
  canonicalTikTokUrl,
} from '@/lib/tiktok';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TikWMVideoData {
  author?: { nickname?: string; unique_id?: string };
  title?: string;
  cover?: string;
  origin_cover?: string;
  play?: string;
  wmplay?: string;
  music?: string;
  music_info?: { play?: string };
  images?: string[];
}

async function fetchTikTokFromTikWM(targetUrl: string, attempt = 0): Promise<TikWMVideoData | null> {
  try {
    const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (data && data.code === 0 && data.data) {
      return data.data as TikWMVideoData;
    }
    // TikWM ücretsiz limiti: 1 istek/sn. Ardışık denemelerde limite takılırsak
    // tek seferlik bekleyip yeniden dene, yoksa çalışan link "bulunamadı" sanılır.
    if (attempt === 0 && typeof data?.msg === 'string' && /limit/i.test(data.msg)) {
      await sleep(1200);
      return fetchTikTokFromTikWM(targetUrl, 1);
    }
  } catch (err) {
    console.warn('TikWM fetch error:', err);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = body.url || '';

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ error: 'Lütfen geçerli bir TikTok linki girin.' }, { status: 400 });
    }

    // Kullanıcı çoğu zaman saf link değil, uygulamanın paylaşım metnini
    // ("Şuna bak: https://...") ya da şemasız linki yapıştırır → içinden çıkar.
    // Kabul edilen TÜM domain'ler: src/lib/tiktok.ts → TIKTOK_ROOT_DOMAINS
    // (tiktok.com, tt.site, douyin.com, iesdouyin.com, musical.ly,
    //  amemv.com, snssdk.com, tiktokv.com + tüm alt domain'leri)
    const extractedUrl = extractTikTokUrl(rawUrl);
    if (!extractedUrl || !isTikTokUrl(extractedUrl)) {
      return NextResponse.json({ error: 'Lütfen geçerli bir TikTok linki yapıştırın.' }, { status: 400 });
    }

    let videoData: TikWMVideoData | null = null;

    // ── 1. Adım: Kısa linkse ÖNCE yönlendirmeyi çöz ──────────────────────
    // KRİTİK: TikWM, tt.site (ve benzeri yeni kısa domain'leri) doğrudan
    // kabul etmiyor ("Url parsing is failed!"). Eski kod TikWM'i önce
    // denediği ve çözümlemeyi sadece vt/vm için yaptığı için tt.site
    // linkleri daha doğrulama aşamasında eleniyordu.
    let resolvedUrl = extractedUrl;
    if (isShortTikTokLink(extractedUrl)) {
      const resolved = await resolveTikTokUrl(extractedUrl);
      if (resolved) resolvedUrl = resolved;
    }

    const videoId =
      extractTikTokVideoId(resolvedUrl) || extractTikTokVideoId(extractedUrl);

    // ── 2. Adım: TikWM'e denenecek adayları sıraya koy ───────────────────
    // En güvenilirden başlayarak: çözülmüş kanonik link → ID'den üretilen
    // kanonik link → (TikWM'in tanıdığı bir domain'deyse) orijinal link.
    const candidates: string[] = [];
    const addCandidate = (u?: string | null) => {
      if (u && !candidates.includes(u)) candidates.push(u);
    };

    if (videoId || !isShortTikTokLink(resolvedUrl)) addCandidate(resolvedUrl);
    if (videoId) addCandidate(canonicalTikTokUrl(videoId, resolvedUrl));
    // TikWM; tt.site / musical.ly gibi domain'leri tanımıyor, onları aday
    // yapıp boşuna limit yakma. Onlarda çözümleme zaten yukarıda yapıldı.
    if (/\.(tiktok\.com|douyin\.com|iesdouyin\.com|tiktokv\.com)$/i.test(new URL(extractedUrl).hostname)) {
      addCandidate(extractedUrl);
    }
    if (candidates.length === 0) addCandidate(resolvedUrl);

    for (const candidate of candidates) {
      videoData = await fetchTikTokFromTikWM(candidate);
      if (videoData) break;
    }

    if (!videoData) {
      return NextResponse.json({
        error: 'Video bilgileri alınamadı. Hesabın gizli veya videonun silinmiş olmadığından emin olun.'
      }, { status: 404 });
    }

    // Format output standard for frontend consume
    const formattedData = {
      author: videoData.author?.nickname || videoData.author?.unique_id || '@tiktok_kullanicisi',
      title: videoData.title || 'TikTok Gönderisi',
      cover: videoData.cover || videoData.origin_cover || '',
      play: videoData.play || videoData.wmplay || '', // Filigransız video MP4
      wmplay: videoData.wmplay || '',
      music: videoData.music || videoData.music_info?.play || '', // Ses MP3
      images: videoData.images && Array.isArray(videoData.images) && videoData.images.length > 0 ? videoData.images : null,
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu, lütfen tekrar deneyin.' }, { status: 500 });
  }
}
