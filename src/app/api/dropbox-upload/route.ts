import { NextRequest, NextResponse } from 'next/server';

const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    if (!DROPBOX_TOKEN) {
      return NextResponse.json({ error: 'Dropbox yapılandırılmamış' }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string || file?.name || 'file';

    if (!file) return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });

    // Dropbox'a yükle
    const path = `/ottiktok-files/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const arrayBuffer = await file.arrayBuffer();

    const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'add',
          autorename: true,
          mute: false,
        }),
      },
      body: arrayBuffer,
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.path_display) {
      return NextResponse.json({ error: uploadData.error_summary || 'Yükleme başarısız' }, { status: 502 });
    }

    // Paylaşılabilir link oluştur
    const shareRes = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: uploadData.path_display,
        settings: { requested_visibility: 'public' },
      }),
    });

    const shareData = await shareRes.json();
    let shareUrl = shareData.url || shareData.error?.shared_link_already_exists?.metadata?.url;

    if (!shareUrl) {
      return NextResponse.json({ error: 'Link oluşturulamadı' }, { status: 502 });
    }

    // Dropbox preview linkini direkt download linkine çevir
    // dl=0 → dl=1 ile direkt indirme, ?raw=1 ile raw içerik
    const directUrl = shareUrl.replace('?dl=0', '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');

    return NextResponse.json({ url: directUrl, path: uploadData.path_display });
  } catch (err: any) {
    console.error('dropbox-upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Max body size için config
export const config = {
  api: { bodyParser: false },
};
