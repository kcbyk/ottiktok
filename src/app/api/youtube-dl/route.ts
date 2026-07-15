import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_HOST = 'youtube-media-downloader.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY_YOUTUBE_MEDIA || '';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const videoId = searchParams.get('videoId');
  const itag = searchParams.get('itag');
  const filename = searchParams.get('filename') || 'youtube_video.mp4';

  if (!videoId || !itag) {
    return NextResponse.json({ error: 'videoId ve itag gerekli' }, { status: 400 });
  }

  try {
    // RapidAPI'den taze URL al — bu URL'lerin ip= kısmı RapidAPI sunucusunun IP'si
    // yani hem serverdan hem clienttan erişilebilir
    const detailRes = await fetch(
      `https://${RAPIDAPI_HOST}/v2/video/details?videoId=${videoId}`,
      {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    if (!detailRes.ok) {
      return NextResponse.json({ error: 'Video detayları alınamadı' }, { status: 502 });
    }

    const detail = await detailRes.json();

    const allItems = [
      ...(detail.videos?.items || []),
      ...(detail.audios?.items || []),
    ];

    const found = allItems.find((item: any) => {
      try {
        const urlObj = new URL(item.url);
        return urlObj.searchParams.get('itag') === itag;
      } catch { return false; }
    });

    if (!found) {
      return NextResponse.json({ error: 'Format bulunamadı' }, { status: 404 });
    }

    // Dosyayı server üzerinden stream et
    // RapidAPI URL'leri herkes tarafından erişilebilir (IP kısıtı yok)
    const videoRes = await fetch(found.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Referer': 'https://www.youtube.com/',
      },
    });

    if (!videoRes.ok) {
      // Stream başarısız — URL'yi döndür, client denesin
      return NextResponse.json({ url: found.url });
    }

    const safeFilename = filename.replace(/[^\x00-\x7F]/g, '').replace(/[\s"']/g, '_') || 'youtube_video.mp4';
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';
    const contentLength = videoRes.headers.get('content-length');

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`);
    headers.set('Content-Type', contentType);
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Cache-Control', 'no-store');

    return new NextResponse(videoRes.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('youtube-dl error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
