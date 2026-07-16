import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.SUPABASE_URL || '';
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET   = process.env.SUPABASE_BUCKET || 'ottiktok-files';

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ error: 'Supabase yapılandırılmamış' }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Dosya boyutu 500 MB sınırını aşıyor' }, { status: 413 });
    }

    // File_Key üret
    const originalName = file.name || 'file';
    const sanitized = originalName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const fileKey = `${Date.now()}_${sanitized || 'file'}`;

    // Supabase Storage'a yükle
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileKey, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Yükleme başarısız: ' + uploadError.message }, { status: 502 });
    }

    // Public URL al
    const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileKey);
    const publicUrl = urlData.publicUrl;

    // Share_Link oluştur
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const shareLink = `${protocol}://${host}/file/${fileKey}`
      + `?url=${encodeURIComponent(publicUrl)}`
      + `&fn=${encodeURIComponent(originalName)}`
      + `&type=${encodeURIComponent(file.type || 'application/octet-stream')}`;

    return NextResponse.json({
      url: publicUrl,
      key: fileKey,
      filename: originalName,
      mimeType: file.type || 'application/octet-stream',
      shareLink,
    });
  } catch (err: any) {
    console.error('upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
