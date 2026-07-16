import { NextRequest, NextResponse } from 'next/server';

// Bu endpoint dosyayı almaz — sadece upload URL + credentials döner.
// Tarayıcı dosyayı direkt Cloudflare R2'ye PUT eder, Vercel üzerinden geçmez.
export const runtime = 'edge';

const CF_ACCOUNT_ID  = process.env.CF_ACCOUNT_ID  || '';
const CF_API_TOKEN   = process.env.CF_API_TOKEN   || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ottiktok-files';
const R2_PUBLIC_URL  = process.env.R2_PUBLIC_URL  || 'https://pub-f0666a218521401bbfb12857551a4628.r2.dev';

export async function POST(req: NextRequest) {
  try {
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return NextResponse.json(
        { error: 'R2 yapılandırılmamış' },
        { status: 503 }
      );
    }

    const { filename, mimeType } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: 'filename gerekli' }, { status: 400 });
    }

    // File_Key üret
    const sanitized = (filename as string)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const fileKey = `${Date.now()}_${sanitized || 'file'}`;

    // Tarayıcının direkt kullanacağı R2 upload URL'i
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${fileKey}`;

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const r2Url = `${R2_PUBLIC_URL}/${fileKey}`;
    const shareLink = `${protocol}://${host}/file/${fileKey}`
      + `?url=${encodeURIComponent(r2Url)}`
      + `&fn=${encodeURIComponent(filename)}`
      + `&type=${encodeURIComponent(mimeType || 'application/octet-stream')}`;

    return NextResponse.json({
      uploadUrl,          // tarayıcı buna PUT yapacak
      token: CF_API_TOKEN, // Authorization header için
      fileKey,
      r2Url,
      shareLink,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
