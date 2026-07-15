import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 gerekli' }, { status: 400 });

    // base64'ten data URL prefix'i kaldır
    const b64 = base64.includes(',') ? base64.split(',')[1] : base64;

    // freeimage.host — ücretsiz, kayıt gerektirmez, kalıcı
    // application/x-www-form-urlencoded ile gönder
    const body = new URLSearchParams();
    body.append('source', b64);
    body.append('type', 'base64');

    const res = await fetch(
      'https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      }
    );

    const data = await res.json();

    if (data.image?.url) {
      return NextResponse.json({ url: data.image.url });
    }

    return NextResponse.json(
      { error: data.error?.message || 'Yükleme başarısız' },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('upload-image error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
