import { NextResponse } from 'next/server';

// ── ytstream: video formatları (hızlı, anında) ──
const YTSTREAM_HOST = 'ytstream-download-youtube-videos.p.rapidapi.com';
const YTSTREAM_KEYS = [
  'cb858c97a3msh3798faa4195f2c4p1ce356jsnfed9edfcad6f', // Key 1
  'adc4b7af04mshadb5aab86d5eff7p1946e8jsn61fbc4deba81', // Key 2
  '550292b6c2msh6f03553b10bc495p15d293jsn1a8ef5f8e47f', // Key 3
  'a25458b35dmshff7650f186959bcp12b071jsn8408bc851eb2', // Key 4
  'f890c11bc2msh5d052433c7ad0d5p15925djsn5a5f8b7a00a3', // Key 5
];

// ── youtube-mp36: kaliteli MP3 (hazır link, anında) ──
const MP36_HOST = 'youtube-mp36.p.rapidapi.com';
const MP36_KEYS = [
  'f890c11bc2msh5d052433c7ad0d5p15925djsn5a5f8b7a00a3', // Key 1
];

function extractVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&#]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortsMatch = url.match(/shorts\/([^?&#]{11})/);
  if (shortsMatch) return shortsMatch[1];
  const shortUrlMatch = url.match(/youtu\.be\/([^?&#]{11})/);
  if (shortUrlMatch) return shortUrlMatch[1];
  return null;
}

async function fetchYtstream(videoId: string, apiKey: string) {
  const res = await fetch(`https://${YTSTREAM_HOST}/dl?id=${videoId}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': YTSTREAM_HOST,
      'x-rapidapi-key': apiKey,
    },
  });
  if (res.status === 429 || res.status === 403 || res.status === 401) return null;
  return res.json();
}

async function fetchMp3(videoId: string, apiKey: string) {
  const res = await fetch(`https://${MP36_HOST}/dl?id=${videoId}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': MP36_HOST,
      'x-rapidapi-key': apiKey,
    },
  });
  if (res.status === 429 || res.status === 403 || res.status === 401) return null;
  return res.json();
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

    if (!streamData) {
      return NextResponse.json({ error: 'Video bulunamadı veya erişim kısıtlı.' }, { status: 400 });
    }

    // Ses+video birleşik formatlar (360p genelde)
    const combinedFormats = (streamData.formats || [])
      .filter((f: any) => f.qualityLabel && f.url && f.mimeType?.includes('video/mp4'))
      .map((f: any) => ({ quality: f.qualityLabel + ' (Sesli)', url: f.url }));

    // Yüksek kalite video (ses yok)
    const seen = new Set<string>();
    const adaptiveVideoFormats = (streamData.adaptiveFormats || [])
      .filter((f: any) => {
        if (!f.qualityLabel || !f.url || !f.mimeType?.includes('video/mp4')) return false;
        if (seen.has(f.qualityLabel)) return false;
        seen.add(f.qualityLabel);
        return true;
      })
      .sort((a: any, b: any) => {
        const order = ['1080p', '720p', '480p', '360p', '240p', '144p'];
        return order.indexOf(a.qualityLabel) - order.indexOf(b.qualityLabel);
      })
      .slice(0, 4)
      .map((f: any) => ({ quality: f.qualityLabel + ' (Sessiz)', url: f.url }));

    const formats = [...combinedFormats, ...adaptiveVideoFormats];

    // MP3: mp36 API'si varsa onu kullan (kaliteli), yoksa ytstream ses
    let musicUrl: string | null = null;
    if (mp3Data?.link) {
      musicUrl = mp3Data.link; // youtube-mp36: hazır MP3 linki
    } else {
      // fallback: ytstream'den m4a ses
      const audioFmt = (streamData.adaptiveFormats || [])
        .filter((f: any) => f.mimeType?.includes('audio/mp4') && f.url)
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
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
      } catch (_) {}
    }

    return NextResponse.json({ title, author, cover, formats, music: musicUrl });
  } catch (error) {
    console.error('YouTube API Hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası, lütfen tekrar deneyin.' }, { status: 500 });
  }
}
