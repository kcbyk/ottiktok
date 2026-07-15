import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('filename') || 'download';

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL parametresi gerekli' }, { status: 400 });
    }

    const isYouTube = fileUrl.includes('googlevideo.com') || fileUrl.includes('youtube.com');

    // YouTube CDN linkleri client IP'sine bağlı signed URL — server-side proxy çalışmaz.
    // Bunun yerine 302 redirect ile tarayıcıyı direkt CDN'e yönlendir.
    // Tarayıcı download header olmadan açar ama mobil de çalışır.
    if (isYouTube) {
      return NextResponse.redirect(fileUrl, { status: 302 });
    }

    // YouTube dışı dosyalar için normal proxy
    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
      },
    });

    if (!response.ok && response.status !== 206) {
      console.error('Fetch failed with status:', response.status);
      throw new Error(`Dosya alınamadı: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    const safeFileName = fileName
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[\s"']/g, '_');

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${safeFileName}"`);
    headers.set('Content-Type', contentType);
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(response.body, {
      status: response.status === 206 ? 206 : 200,
      headers,
    });
  } catch (error: any) {
    console.error('Force download error:', error);
    return NextResponse.json({ error: 'İndirme işlemi başlatılamadı', details: error.message }, { status: 500 });
  }
}
