import { NextRequest, NextResponse } from 'next/server';

// In-memory store — Vercel serverless'ta her instance ayrı çalışır.
// Bu yüzden fotoğrafı base64 olarak URL'ye encode edip /photo sayfasına geçiriyoruz.
// Store'a gerek yok — fotoğraf data URL olarak query param'da taşınır.
// Büyük fotoğraflar için Vercel URL limiti aşılabilir (max ~8KB URL).
// Çözüm: fotoğrafı sıkıştır + küçült, sonra base64'ü URL'ye koy.

export async function POST(req: NextRequest) {
  try {
    const { base64, filename } = await req.json();
    if (!base64) return NextResponse.json({ error: 'base64 gerekli' }, { status: 400 });

    // base64'ü kısalt — küçük boyutlu JPEG olarak tut
    const b64data = base64.includes(',') ? base64.split(',')[1] : base64;
    const mimeType = base64.includes('data:') ? base64.split(';')[0].split(':')[1] : 'image/jpeg';

    // Benzersiz ID üret
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    // Host'u al
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    // Fotoğraf verisini base64 olarak encode edip /photo/[id] sayfasına geç
    // URL çok uzun olmasın diye base64'ü encodeURIComponent ile koruyoruz
    const photoUrl = `${protocol}://${host}/photo/${id}?d=${encodeURIComponent(base64)}&fn=${encodeURIComponent(filename || 'photo')}`;

    // URL çok uzunsa (>4000 char) uyar
    if (photoUrl.length > 8000) {
      return NextResponse.json({ error: 'Fotoğraf çok büyük. Daha küçük bir görsel deneyin.' }, { status: 413 });
    }

    return NextResponse.json({ url: photoUrl, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
