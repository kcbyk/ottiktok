import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface CloudinaryAccount {
  cloud: string;
  key: string;
  secret: string;
}

function getAccounts(): CloudinaryAccount[] {
  if (process.env.CLOUDINARY_ACCOUNTS) {
    try { return JSON.parse(process.env.CLOUDINARY_ACCOUNTS); } catch {}
  }
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
  isRaw: boolean,
): Promise<{ secure_url: string; public_id: string } | null> {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = 'ottiktok-files';

  // raw dosyalar için resource_type=raw
  const resourceType = isRaw ? 'raw' : 'image';
  const signStr = `folder=${folder}&timestamp=${timestamp}${account.secret}`;
  const signature = crypto.createHash('sha256').update(signStr).digest('hex');

  const form = new FormData();
  form.append('file', base64);
  form.append('api_key', account.key);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${account.cloud}/${resourceType}/upload`,
    { method: 'POST', body: form }
  );
  const data = await res.json();
  if (data.secure_url) return { secure_url: data.secure_url, public_id: data.public_id };
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { base64, filename, mimeType } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 gerekli' }, { status: 400 });

    const accounts = getAccounts();
    if (accounts.length === 0) return NextResponse.json({ error: 'Cloudinary yapılandırılmamış' }, { status: 503 });

    const account = accounts[Math.floor(Math.random() * accounts.length)];

    // Görsel mi yoksa dosya mı?
    const isImage = mimeType?.startsWith('image/') || (!mimeType && base64.startsWith('data:image/'));
    const isRaw = !isImage;

    const result = await uploadToCloudinary(account, base64, isRaw);

    if (result) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const fn = encodeURIComponent(filename || 'file');
      const fileUrl = encodeURIComponent(result.secure_url);
      const id = result.public_id.split('/').pop() || 'f';

      // Görsel → /photo/[id], dosya → /file/[id]
      const viewPath = isImage ? 'photo' : 'file';
      const viewUrl = `${protocol}://${host}/${viewPath}/${id}?url=${fileUrl}&fn=${fn}&type=${encodeURIComponent(mimeType || '')}`;

      return NextResponse.json({ url: viewUrl, fileUrl: result.secure_url });
    }

    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 502 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
