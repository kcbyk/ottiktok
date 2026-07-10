import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Lütfen bir link yapıştırın.' }, { status: 400 });
    }

    // Basit bir güvenlik kontrolü: linkin içinde tiktok.com veya v.douyin.com olmalı
    if (!url.includes('tiktok.com') && !url.includes('douyin.com')) {
      return NextResponse.json({ error: 'Lütfen geçerli bir TikTok linki girin.' }, { status: 400 });
    }

    // TikWM açık kaynak / ücretsiz API'sini kullanıyoruz
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const data = await response.json();

    if (data.code === -1 || !data.data) {
      return NextResponse.json({ error: data.msg || 'Video bulunamadı. Gizli bir hesap veya hatalı link olabilir.' }, { status: 400 });
    }

    const videoData = data.data;

    // Frontend'in beklediği formata dönüştür
    const formattedData = {
      author: videoData.author?.nickname || "@tiktok_kullanicisi",
      title: videoData.title || "TikTok Gönderisi",
      cover: videoData.cover,
      play: videoData.play, // Video (eğer varsa)
      music: videoData.music, // Ses
      images: videoData.images || null, // Fotoğraflar (eğer fotoğraf gönderisiyse)
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("API Hatası:", error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu, lütfen tekrar deneyin.' }, { status: 500 });
  }
}
