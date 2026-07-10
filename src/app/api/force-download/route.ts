import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('filename') || 'download';

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL parametresi gerekli' }, { status: 400 });
    }

    // Hedef URL'den veriyi stream olarak alıyoruz
    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error('Dosya alınamadı');
    }

    // Doğrudan indirme yapması için Content-Disposition başlığı ekliyoruz
    const headers = new Headers(response.headers);
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    // Güvenlik için bazı başlıkları temizliyoruz
    headers.delete('content-encoding');

    return new NextResponse(response.body, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Force download error:', error);
    return NextResponse.json({ error: 'İndirme işlemi başlatılamadı' }, { status: 500 });
  }
}
