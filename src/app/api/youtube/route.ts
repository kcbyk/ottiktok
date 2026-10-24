import { NextResponse } from 'next/server';

// ── ytstream: video formatları (hızlı, anında) ──
const YTSTREAM_HOST = 'ytstream-download-youtube-videos.p.rapidapi.com';
// API anahtarlarını ortam değişkenlerinden güvenli şekilde çekiyoruz
const YTSTREAM_KEYS = process.env.RAPIDAPI_KEYS ? process.env.RAPIDAPI_KEYS.split(',').map(k => k.trim()).filter(Boolean) : [];
const MP36_KEYS = YTSTREAM_KEYS.length > 4 ? [YTSTREAM_KEYS[4]] : (YTSTREAM_KEYS.length > 0 ? [YTSTREAM_KEYS[0]] : []);
const MP36_HOST = 'youtube-mp36.p.rapidapi.com';

// ── Cobalt yedeği (opsiyonel) ──
// Kendi Cobalt instance'ının adresi. Tanımlı DEĞİLSE bu katman tamamen atlanır;
// hiçbir topluluk instance'ı sabit kodlanmaz (Cobalt dokümanı izinsiz kullanımı
// yasaklar, topluluk instance'ları da kırılgandır). Kurulum: render.yaml + docs/indirme-api-arastirma.md
const COBALT_API_URL = (process.env.COBALT_API_URL || '').replace(/\/$/, '');
const COBALT_API_KEY = process.env.COBALT_API_KEY || '';

function extractVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&#]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortsMatch = url.match(/shorts\/([^?&#]{11})/);
  if (shortsMatch) return shortsMatch[1];
  const shortUrlMatch = url.match(/youtu\.be\/([^?&#]{11})/);
  if (shortUrlMatch) return shortUrlMatch[1];
  return null;
}

async function fetchYtstream(videoId: string, apiKey: string): Promise<YtStreamData | null> {
  const res = await fetch(`https://${YTSTREAM_HOST}/dl?id=${videoId}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': YTSTREAM_HOST,
      'x-rapidapi-key': apiKey,
    },
  });
  if (res.status === 429 || res.status === 403 || res.status === 401) return null;
  return res.json().catch(() => null);
}

async function fetchMp3(videoId: string, apiKey: string): Promise<Mp3Data | null> {
  const res = await fetch(`https://${MP36_HOST}/dl?id=${videoId}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': MP36_HOST,
      'x-rapidapi-key': apiKey,
    },
  });
  if (res.status === 429 || res.status === 403 || res.status === 401) return null;
  return res.json().catch(() => null);
}

type CobaltResponse = {
  status: 'tunnel' | 'redirect' | 'picker' | 'local-processing' | 'error';
  url?: string;
  filename?: string;
  picker?: { url?: string; type?: string }[];
  tunnel?: string[];
};

// ytstream / youtube-mp36 format alanları
type YtFormat = {
  qualityLabel?: string;
  url?: string;
  mimeType?: string;
  bitrate?: number;
  itag?: string;
};
type YtStreamData = {
  formats?: YtFormat[];
  adaptiveFormats?: YtFormat[];
  title?: string;
  channelTitle?: string;
};
type Mp3Data = { status?: string; link?: string; title?: string };

/**
 * Cobalt v11 POST / — yalnızca COBALT_API_URL tanımlıysa çalışır.
 * Dönen status: tunnel | redirect | picker | local-processing | error
 * Doküman: https://github.com/imputnet/cobalt/blob/main/docs/api.md
 */
async function fetchCobalt(url: string): Promise<CobaltResponse | null> {
  if (!COBALT_API_URL) return null;
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (COBALT_API_KEY) headers['Authorization'] = `Api-Key ${COBALT_API_KEY}`;

    const res = await fetch(COBALT_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        videoQuality: '720',
        youtubeVideoCodec: 'h264',
        youtubeVideoContainer: 'mp4',
        downloadMode: 'auto',
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data: CobaltResponse | null = await res.json().catch(() => null);
    if (!res.ok || !data) return null;
    if (!['tunnel', 'redirect', 'picker', 'local-processing'].includes(data.status)) return null;
    return data;
  } catch {
    return null;
  }
}

/** Cobalt yanıtını uygulamanın `formats[]` şemasına dönüştür. */
function cobaltToFormats(data: CobaltResponse): { url: string; quality: string; itag: string | null }[] {
  const out: { url: string; quality: string; itag: string | null }[] = [];
  const push = (u: string | undefined, label: string) => {
    if (!u) return;
    let itag: string | null = null;
    try { itag = new URL(u).searchParams.get('itag'); } catch { /* ignore */ }
    out.push({ url: u, quality: label, itag });
  };

  if (data.status === 'tunnel' || data.status === 'redirect') {
    push(data.url, data.status === 'tunnel' ? '720p (Cobalt tünel)' : '720p (Cobalt yönlendirme)');
  } else if (data.status === 'picker' && Array.isArray(data.picker)) {
    for (const item of data.picker) push(item?.url, item?.type ? `Cobalt: ${item.type}` : 'Cobalt');
  } else if (data.status === 'local-processing' && Array.isArray(data.tunnel)) {
    data.tunnel.forEach((t: string, i: number) => push(t, `Cobalt parça ${i + 1}`));
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Lütfen bir link yapıştırın.' }, { status: 400 });
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json({ error: 'Lütfen geçerli bir YouTube linki girin.' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID bulunamadı. Linki kontrol edin.' }, { status: 400 });
    }

    // Ytstream ve MP36'yı paralel olarak çalıştır (hız için)
    const [streamData, mp3Data] = await Promise.all([
      // ytstream key'lerini sırayla dene
      (async () => {
        for (const key of YTSTREAM_KEYS) {
          const d = await fetchYtstream(videoId, key);
          if (d) return d;
        }
        return null;
      })(),
      // mp36 key'lerini sırayla dene
      (async () => {
        for (const key of MP36_KEYS) {
          const d = await fetchMp3(videoId, key);
          if (d && d.status === 'ok') return d;
        }
        return null;
      })(),
    ]);

    // ── Yedek: RapidAPI tamamen başarısız olduysa kendi Cobalt instance'ını dene ──
    if (!streamData && COBALT_API_URL) {
      const cobalt = await fetchCobalt(url);
      if (cobalt) {
        const formats = cobaltToFormats(cobalt);
        if (formats.length > 0) {
          const cover = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          return NextResponse.json({
            title: cobalt?.filename?.replace(/\.(mp4|webm|mkv|mp3)$/i, '') || 'YouTube Videosu',
            author: 'YouTube',
            cover,
            formats,
            music: null,
            videoId,
            source: 'cobalt',
          });
        }
      }
    }

    if (!streamData) {
      return NextResponse.json({ error: 'Video bulunamadı veya erişim kısıtlı.' }, { status: 400 });
    }

    // Sadece ses+video birleşik formatlar (bunlar sesli ve genelde 360p/720p)
    // Büyük dosyalar Vercel'de timeout'a girer, sadece makul boyutları sun
    const combinedFormats = (streamData.formats || [])
      .filter((f: YtFormat) => f.qualityLabel && f.url && f.mimeType?.includes('video/mp4'))
      .map((f: YtFormat) => {
        const urlObj = new URL(f.url as string);
        return { quality: f.qualityLabel + ' (Sesli)', url: f.url, itag: urlObj.searchParams.get('itag') };
      });

    // Yüksek kalite video (ses yok) - sadece 720p ve altı
    const seen = new Set<string>();
    const adaptiveVideoFormats = (streamData.adaptiveFormats || [])
      .filter((f: YtFormat) => {
        if (!f.qualityLabel || !f.url || !f.mimeType?.includes('video/mp4')) return false;
        if (seen.has(f.qualityLabel)) return false;
        // 1080p ve üstü Vercel'de timeout'a girer — çıkar
        if (['1080p', '1440p', '2160p'].includes(f.qualityLabel)) return false;
        seen.add(f.qualityLabel);
        return true;
      })
      .sort((a: YtFormat, b: YtFormat) => {
        const order = ['720p', '480p', '360p', '240p', '144p'];
        return order.indexOf(a.qualityLabel || '') - order.indexOf(b.qualityLabel || '');
      })
      .slice(0, 3)
      .map((f: YtFormat) => {
        const urlObj = new URL(f.url as string);
        return { quality: f.qualityLabel + ' (Sessiz)', url: f.url, itag: urlObj.searchParams.get('itag') };
      });

    const formats = [...combinedFormats, ...adaptiveVideoFormats];

    // MP3: mp36 API'si varsa onu kullan (kaliteli), yoksa ytstream ses
    let musicUrl: string | null = null;
    if (mp3Data?.link) {
      musicUrl = mp3Data.link; // youtube-mp36: hazır MP3 linki
    } else {
      // fallback: ytstream'den m4a ses
      const audioFmt = (streamData.adaptiveFormats || [])
        .filter((f: YtFormat) => f.mimeType?.includes('audio/mp4') && f.url)
        .sort((a: YtFormat, b: YtFormat) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      musicUrl = audioFmt?.url || null;
    }

    // Başlık: ytstream varsa al, yoksa oEmbed
    const cover = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    let title = streamData.title || mp3Data?.title || 'YouTube Videosu';
    let author = streamData.channelTitle || '';

    if (!streamData.title) {
      try {
        const oembed = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (oembed.ok) {
          const meta = await oembed.json();
          title = meta.title || title;
          author = meta.author_name || author;
        }
      } catch { /* oEmbed başarısız — varsayılan başlık kalır */ }
    }

    return NextResponse.json({ title, author, cover, formats, music: musicUrl, videoId });
  } catch (error) {
    console.error('YouTube API Hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası, lütfen tekrar deneyin.' }, { status: 500 });
  }
}
