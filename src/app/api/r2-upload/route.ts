import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Bu endpoint dosyayı almaz.
// Tarayıcıya signed upload URL döner — tarayıcı direkt Supabase'e yükler.
const SUPABASE_URL    = process.env.SUPABASE_URL || '';
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'ottiktok-files';

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ error: 'Supabase yapılandırılmamış' }, { status: 503 });
    }

    const { filename, mimeType } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: 'filename gerekli' }, { status: 400 });
    }

    const sanitized = (filename as string)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const fileKey = `${Date.now()}_${sanitized || 'file'}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Tarayıcının direkt Supabase'e PUT yapması için signed URL üret
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .createSignedUploadUrl(fileKey);

    if (error || !data) {
      return NextResponse.json({ error: 'Signed URL alınamadı: ' + error?.message }, { status: 502 });
    }

    // Public erişim URL'i
    const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileKey);
    const publicUrl = urlData.publicUrl;

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const shareLink = `${protocol}://${host}/file/${fileKey}`
      + `?url=${encodeURIComponent(publicUrl)}`
      + `&fn=${encodeURIComponent(filename)}`
      + `&type=${encodeURIComponent(mimeType || 'application/octet-stream')}`;

    return NextResponse.json({
      signedUrl: data.signedUrl,  // tarayıcı buna PUT yapacak
      token: data.token,          // upload token
      fileKey,
      publicUrl,
      shareLink,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
