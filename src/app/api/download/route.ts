import { NextResponse } from 'next/server';

async function fetchTikTokFromTikWM(targetUrl: string) {
  try {
    const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      cache: 'no-store'
    });
    const data = await response.json();
    if (data && data.code === 0 && data.data) {
      return data.data;
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

    const trimmedUrl = rawUrl.trim();

    // Check if input contains tiktok, douyin, or video ID pattern
    const isTikTok = trimmedUrl.includes('tiktok.com') || trimmedUrl.includes('douyin.com') || /\d{17,19}/.test(trimmedUrl);
    if (!isTikTok) {
      return NextResponse.json({ error: 'Lütfen geçerli bir TikTok linki yapıştırın.' }, { status: 400 });
    }

    let videoData = null;

    // Step 1: Direct TikWM lookup with provided URL
    videoData = await fetchTikTokFromTikWM(trimmedUrl);

    // Step 2: If raw fetch failed, resolve short link or clean video URL
    if (!videoData) {
      let resolvedUrl = trimmedUrl;
      if (trimmedUrl.includes('vt.tiktok.com') || trimmedUrl.includes('vm.tiktok.com') || trimmedUrl.includes('/v/')) {
        try {
          const redRes = await fetch(trimmedUrl, {
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          resolvedUrl = redRes.url || trimmedUrl;
        } catch (e) {
          console.warn('Redirect resolution error:', e);
        }
      }

      // Extract 17-19 digit video ID
      const idMatch = resolvedUrl.match(/video\/(\d+)/) || resolvedUrl.match(/\/v\/(\d+)/) || resolvedUrl.match(/(\d{17,19})/);
      const videoId = idMatch ? idMatch[1] : null;

      if (videoId) {
        const cleanUrl = `https://www.tiktok.com/@a/video/${videoId}`;
        videoData = await fetchTikTokFromTikWM(cleanUrl);
      }

      if (!videoData && resolvedUrl !== trimmedUrl) {
        videoData = await fetchTikTokFromTikWM(resolvedUrl);
      }
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
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu, lütfen tekrar deneyin.' }, { status: 500 });
  }
}

