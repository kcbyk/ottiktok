import { NextRequest, NextResponse } from 'next/server';

// imgbb ücretsiz API — https://api.imgbb.com/ adresinden ücretsiz key alınır
// Key yoksa freeimage.host fallback
const IMGBB_KEY = process.env.IMGBB_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 gerekli' }, { status: 400 });

    // base64'ten data URL prefix'i kaldır
    const b64 = base64.includes(',') ? base64.split(',')[1] : base64;

    // imgbb'ye yükle (10 dk expire)
    const form = new FormData();
    form.append('image', b64);
    
    const url = IMGBB_KEY
      ? `https://api.imgbb.com/1/upload?expiration=600&key=${IMGBB_KEY}`
      : `https://api.imgbb.com/1/upload?expiration=600&key=2e45e3f4f3a5f0f5f6f7f8f9f0f1f2f3`;

    const res = await fetch(url, { method: 'POST', body: form });
    const data = await res.json();

    if (data.data?.url) {
      return NextResponse.json({ url: data.data.url, displayUrl: data.data.display_url });
    }

    // Fallback: freeimage.host
    const form2 = new FormData();
    form2.append('source', b64);
    form2.append('type', 'base64');
    const res2 = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
      method: 'POST', body: form2,
    });
    const data2 = await res2.json();
    if (data2.image?.url) {
      return NextResponse.json({ url: data2.image.url });
    }

    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 502 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
