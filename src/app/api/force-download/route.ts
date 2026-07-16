import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Edge runtime — body size limiti yok, streaming destekli

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('filename') || 'download';

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL parametresi gerekli' }, { status: 400 });
    }

    const isYouTube = fileUrl.includes('googlevideo.com') || fileUrl.includes('youtube.com');

    // YouTube CDN linkleri client IP'sine bağlı — direkt redirect
    if (isYouTube) {
      return NextResponse.redirect(fileUrl, { status: 302 });
    }

    // Tüm diğer dosyalar: proxy stream
    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      // Fetch başarısız olursa direkt redirect dene
      return NextResponse.redirect(fileUrl, { status: 302 });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Dosya adını ASCII'ye çevir (Content-Disposition için)
    const safeFileName = encodeURIComponent(fileName);

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${safeFileName}`);
    headers.set('Content-Type', contentType);
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'no-store');

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Force download error:', error);
    // Son çare: redirect
    const fileUrl = new URL(request.url).searchParams.get('url');
    if (fileUrl) return NextResponse.redirect(fileUrl, { status: 302 });
    return NextResponse.json({ error: 'İndirme başarısız' }, { status: 500 });
  }
}
