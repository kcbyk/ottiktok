import { NextRequest, NextResponse } from 'next/server';

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || '546c25a59c58ad7';

export async function POST(req: NextRequest) {
  try {
    const { base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 gerekli' }, { status: 400 });

    const b64 = base64.includes(',') ? base64.split(',')[1] : base64;

    const body = new URLSearchParams();
    body.append('image', b64);
    body.append('type', 'base64');

    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await res.json();

    if (data.data?.link) {
      const imgUrl = data.data.link; // https://i.imgur.com/xxxx.jpg
      // QR için: kendi temiz fotoğraf sayfamıza yönlendir
      // URL'yi encode ederek kendi /photo/[id] sayfamıza geç
      const imgId = data.data.id || imgUrl.split('/').pop()?.split('.')[0] || 'img';
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const viewUrl = `${protocol}://${host}/photo/${imgId}?url=${encodeURIComponent(imgUrl)}`;
      return NextResponse.json({ url: viewUrl, imgUrl });
    }

    return NextResponse.json(
      { error: data.data?.error || 'Yükleme başarısız' },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('upload-image error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
