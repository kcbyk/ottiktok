import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_HOST = 'youtube-media-downloader.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY_YOUTUBE_MEDIA || '';

// Sadece taze URL döndür — stream etme, Vercel timeout'u aşar.
// Client bu URL'yi window.open ile açar, tarayıcı indirir.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const videoId = searchParams.get('videoId');
  const itag = searchParams.get('itag');

  if (!videoId || !itag) {
    return NextResponse.json({ error: 'videoId ve itag gerekli' }, { status: 400 });
  }

  try {
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

    // Taze URL döndür — client açacak
    return NextResponse.json({ url: found.url, mimeType: found.mimeType || 'video/mp4' });
  } catch (err: any) {
    console.error('youtube-dl error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
