import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CF_ACCOUNT_ID  = process.env.CF_ACCOUNT_ID  || '';
const CF_API_TOKEN   = process.env.CF_API_TOKEN   || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ottiktok-files';
const R2_PUBLIC_URL  = process.env.R2_PUBLIC_URL  || 'https://pub-f0666a218521401bbfb12857551a4628.r2.dev';

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(req: NextRequest) {
  try {
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return NextResponse.json(
        { error: 'R2 yapılandırılmamış' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu 500 MB sınırını aşıyor' },
        { status: 413 }
      );
    }

    // File_Key üret
    const originalName = file.name || 'file';
    const sanitized = originalName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const fileKey = `${Date.now()}_${sanitized || 'file'}`;

    // Cloudflare REST API ile R2'ye yükle
    const arrayBuffer = await file.arrayBuffer();
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${fileKey}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: arrayBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return NextResponse.json(
        { error: `Yükleme başarısız (${uploadRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    // Share_Link oluştur
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const r2Url = `${R2_PUBLIC_URL}/${fileKey}`;
    const shareLink = `${protocol}://${host}/file/${fileKey}`
      + `?url=${encodeURIComponent(r2Url)}`
      + `&fn=${encodeURIComponent(originalName)}`
      + `&type=${encodeURIComponent(file.type || 'application/octet-stream')}`;

    return NextResponse.json({
      url: r2Url,
      key: fileKey,
      filename: originalName,
      mimeType: file.type || 'application/octet-stream',
      shareLink,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
