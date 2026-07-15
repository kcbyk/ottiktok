import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'webp';
    const quality = parseInt((formData.get('quality') as string) || '85', 10);
    const width = formData.get('width') ? parseInt(formData.get('width') as string, 10) : null;
    const height = formData.get('height') ? parseInt(formData.get('height') as string, 10) : null;
    const keepAspect = formData.get('keepAspect') !== 'false';

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    }

    const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif'];
    const normalizedFormat = format === 'jpg' ? 'jpeg' : format;
    if (!validFormats.includes(normalizedFormat)) {
      return NextResponse.json({ error: 'Geçersiz format.' }, { status: 400 });
    }

    // Dosya boyutu kontrolü: max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dosya çok büyük. Maksimum 20MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let pipeline = sharp(buffer);

    // Boyut ayarı
    if (width || height) {
      pipeline = pipeline.resize(
        width || null,
        height || null,
        { fit: keepAspect ? 'inside' : 'fill', withoutEnlargement: false }
      );
    }

    // Format dönüştürme
    let outputBuffer: Buffer;
    let mimeType: string;
    let ext: string;

    if (normalizedFormat === 'jpeg') {
      outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      mimeType = 'image/jpeg';
      ext = 'jpg';
    } else if (normalizedFormat === 'png') {
      outputBuffer = await pipeline.png({ compressionLevel: Math.round((100 - quality) / 11) }).toBuffer();
      mimeType = 'image/png';
      ext = 'png';
    } else if (normalizedFormat === 'webp') {
      outputBuffer = await pipeline.webp({ quality }).toBuffer();
      mimeType = 'image/webp';
      ext = 'webp';
    } else {
      outputBuffer = await pipeline.avif({ quality }).toBuffer();
      mimeType = 'image/avif';
      ext = 'avif';
    }

    // Orijinal dosya adından uzantıyı çıkar
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const filename = `${originalName}_converted.${ext}`;

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': outputBuffer.byteLength.toString(),
        'X-Original-Size': file.size.toString(),
        'X-Converted-Size': outputBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('Görsel dönüştürme hatası:', error);
    return NextResponse.json(
      { error: 'Dönüştürme başarısız. Geçerli bir görsel yüklediğinizden emin olun.' },
      { status: 500 }
    );
  }
}
