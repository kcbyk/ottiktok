import { NextRequest, NextResponse } from 'next/server';

// Imgur anonim upload — Client-ID ile key gerektirmez
// https://i.imgur.com/... URL'leri evrensel, SSL sorunsuz
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || '546c25a59c58ad7';

export async function POST(req: NextRequest) {
  try {
    const { base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 gerekli' }, { status: 400 });

    // data URL prefix varsa kaldır
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
      return NextResponse.json({ url: data.data.link });
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
