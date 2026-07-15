import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const { base64, filename } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 gerekli' }, { status: 400 });

    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = 'ottiktok-photos';

    // Cloudinary signature
    const signStr = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash('sha256').update(signStr).digest('hex');

    const form = new FormData();
    form.append('file', base64); // data URL olarak gönder
    form.append('api_key', API_KEY);
    form.append('timestamp', timestamp);
    form.append('signature', signature);
    form.append('folder', folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: form }
    );

    const data = await res.json();

    if (data.secure_url) {
      // Kendi viewer sayfasına yönlendir
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const fn = encodeURIComponent(filename || 'photo.jpg');
      const imgUrl = encodeURIComponent(data.secure_url);
      const id = data.public_id.split('/').pop() || 'img';
      const viewUrl = `${protocol}://${host}/photo/${id}?url=${imgUrl}&fn=${fn}`;

      return NextResponse.json({ url: viewUrl, imgUrl: data.secure_url });
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
