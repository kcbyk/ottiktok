import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Client-side direct upload için imza üretir
// Dosya client'tan direkt Cloudinary'ye gider — Vercel body limiti yok
export async function POST(req: NextRequest) {
  try {
    const { mimeType, filename } = await req.json();

    const cloud = process.env.CLOUDINARY_CLOUD_NAME || '';
    const key = process.env.CLOUDINARY_API_KEY || '';
    const secret = process.env.CLOUDINARY_API_SECRET || '';

    if (!cloud || !key || !secret) {
      return NextResponse.json({ error: 'Cloudinary yapılandırılmamış' }, { status: 503 });
    }

    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = 'ottiktok-files';

    const signStr = `folder=${folder}&timestamp=${timestamp}${secret}`;
    const signature = crypto.createHash('sha256').update(signStr).digest('hex');

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloud,
      apiKey: key,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
