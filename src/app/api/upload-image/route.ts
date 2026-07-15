import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface CloudinaryAccount {
  cloud: string;
  key: string;
  secret: string;
}

// Çoklu hesap — virgülle ayrılmış JSON array veya tek hesap env variable'lardan
function getAccounts(): CloudinaryAccount[] {
  // CLOUDINARY_ACCOUNTS env var varsa onu kullan (JSON array)
  if (process.env.CLOUDINARY_ACCOUNTS) {
    try {
      return JSON.parse(process.env.CLOUDINARY_ACCOUNTS);
    } catch {}
  }
  // Fallback: tekli hesap env variable'lardan
  const single: CloudinaryAccount = {
    cloud: process.env.CLOUDINARY_CLOUD_NAME || '',
    key: process.env.CLOUDINARY_API_KEY || '',
    secret: process.env.CLOUDINARY_API_SECRET || '',
  };
  if (single.cloud && single.key && single.secret) return [single];
  return [];
}

async function uploadToCloudinary(
  account: CloudinaryAccount,
  base64: string,
): Promise<{ secure_url: string; public_id: string } | null> {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = 'ottiktok-photos';

  const signStr = `folder=${folder}&timestamp=${timestamp}${account.secret}`;
  const signature = crypto.createHash('sha256').update(signStr).digest('hex');

  const form = new FormData();
  form.append('file', base64);
  form.append('api_key', account.key);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${account.cloud}/image/upload`,
    { method: 'POST', body: form }
  );

  const data = await res.json();
  if (data.secure_url) return { secure_url: data.secure_url, public_id: data.public_id };
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { base64, filename } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 gerekli' }, { status: 400 });

    const accounts = getAccounts();
    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Cloudinary hesabı yapılandırılmamış' }, { status: 503 });
    }

    // Rastgele bir hesap seç — yükü dağıt
    const account = accounts[Math.floor(Math.random() * accounts.length)];

    const result = await uploadToCloudinary(account, base64);

    if (result) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const fn = encodeURIComponent(filename || 'photo.jpg');
      const imgUrl = encodeURIComponent(result.secure_url);
      const id = result.public_id.split('/').pop() || 'img';
      const viewUrl = `${protocol}://${host}/photo/${id}?url=${imgUrl}&fn=${fn}`;

      return NextResponse.json({ url: viewUrl, imgUrl: result.secure_url });
    }

    // Tüm hesaplar başarısız
    return NextResponse.json({ error: 'Yükleme başarısız. Lütfen tekrar deneyin.' }, { status: 502 });
  } catch (err: any) {
    console.error('upload-image error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
