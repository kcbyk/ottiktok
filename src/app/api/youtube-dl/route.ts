import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_HOST = 'youtube-media-downloader.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY_YOUTUBE_MEDIA || '';

// Bu endpoint: videoId + itag alır, URL'yi Vercel'in kendi IP'siyle çeker ve stream eder.
// Böylece signed URL'nin içindeki IP Vercel'in IP'siyle eşleşir — mobilde de çalışır.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const videoId = searchParams.get('videoId');
  const itag = searchParams.get('itag');
  const filename = searchParams.get('filename') || 'youtube_video.mp4';

  if (!videoId || !itag) {
    return NextResponse.json({ error: 'videoId ve itag gerekli' }, { status: 400 });
  }

  try {
    // 1. Önce video detaylarını al (URL'yi taze çek)
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

    // itag'a göre URL'yi bul
    const allItems = [
      ...(detail.videos?.items || []),
      ...(detail.audios?.items || []),
    ];

    const found = allItems.find((item: any) => {
      const urlObj = new URL(item.url);
      return urlObj.searchParams.get('itag') === itag;
    });

    if (!found) {
      return NextResponse.json({ error: 'Format bulunamadı' }, { status: 404 });
    }

    // 2. Aynı Vercel IP'siyle stream et
    const videoRes = await fetch(found.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Range': 'bytes=0-',
      },
    });

    if (!videoRes.ok && videoRes.status !== 206) {
      return NextResponse.json({ error: `CDN hatası: ${videoRes.status}` }, { status: 502 });
    }

    const safeFilename = filename.replace(/[^\x00-\x7F]/g, '').replace(/[\s"']/g, '_');
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';
    const contentLength = videoRes.headers.get('content-length');

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`);
    headers.set('Content-Type', contentType);
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(videoRes.body, {
      status: videoRes.status === 206 ? 206 : 200,
      headers,
    });
  } catch (err: any) {
    console.error('youtube-dl error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
