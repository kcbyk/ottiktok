import { NextResponse } from 'next/server';

const RAPIDAPI_HOST = 'instagram-reels-downloader-api.p.rapidapi.com';

// Her key'in aylık limiti: ~100 istek (ücretsiz plan)
// Toplam: 5 x 100 = 500 istek/ay
const API_KEYS = [
  'cb858c97a3msh3798faa4195f2c4p1ce356jsnfed9edfcad6f', // Key 1
  'a25458b35dmshff7650f186959bcp12b071jsn8408bc851eb2', // Key 2
  'adc4b7af04mshadb5aab86d5eff7p1946e8jsn61fbc4deba81', // Key 3
  '550292b6c2msh6f03553b10bc495p15d293jsn1a8ef5f8e47f', // Key 4
  'f890c11bc2msh5d052433c7ad0d5p15925djsn5a5f8b7a00a3', // Key 5
];

async function fetchInstagram(url: string, apiKey: string) {
  const apiUrl = `https://${RAPIDAPI_HOST}/download?url=${encodeURIComponent(url)}`;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': apiKey,
    },
  });

  // Rate limit aşıldıysa veya yetkisizse null döndür → sonraki key denenecek
  if (response.status === 429 || response.status === 403 || response.status === 401) {
    return null;
  }

  return response.json();
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Lütfen bir link yapıştırın.' }, { status: 400 });
    }

    if (!url.includes('instagram.com')) {
      return NextResponse.json({ error: 'Lütfen geçerli bir Instagram linki girin.' }, { status: 400 });
    }

    // Tüm key'leri sırayla dene
    let data = null;
    let usedKeyIndex = -1;

    for (let i = 0; i < API_KEYS.length; i++) {
      data = await fetchInstagram(url, API_KEYS[i]);
      if (data !== null) {
        usedKeyIndex = i + 1; // 1-tabanlı
        break;
      }
    }

    if (!data || !data.success || !data.data) {
      return NextResponse.json(
        { error: 'Tüm API limitleri doldu veya video bulunamadı. Lütfen daha sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    const videoData = data.data;

    // Video tespiti için esnek filtreleme
    const videoMedia = videoData.medias?.find((m: any) => 
      m.type?.toLowerCase() === 'video' || 
      m.extension?.toLowerCase() === 'mp4' ||
      m.url?.includes('.mp4') ||
      m.url?.includes('video')
    );

    // Ses tespiti
    const audioMedia = videoData.medias?.find((m: any) => 
      m.type?.toLowerCase() === 'audio' || 
      m.extension?.toLowerCase() === 'mp3' || 
      m.extension?.toLowerCase() === 'm4a' ||
      m.url?.includes('.mp3') ||
      m.url?.includes('.m4a')
    );
    
    // Görsel/Fotoğraf tespiti
    const images = videoData.medias
      ?.filter((m: any) => 
        m.type?.toLowerCase() === 'image' || 
        m.type?.toLowerCase() === 'photo' ||
        m.extension?.toLowerCase() === 'jpg' ||
        m.extension?.toLowerCase() === 'jpeg' ||
        m.extension?.toLowerCase() === 'png' ||
        m.url?.includes('.jpg') ||
        m.url?.includes('.jpeg') ||
        m.url?.includes('.png')
      )
      ?.map((m: any) => m.url) || [];

    // Fallback: Eğer play url bulunamadıysa ama alternatif alanlarda varsa al
    let playUrl = videoMedia?.url || videoData.video_url || videoData.download_url || videoData.video || null;
    
    // Fallback 2: Eğer playUrl hala yoksa ve en az 1 tane audio olmayan medya varsa onu kullan
    if (!playUrl && videoData.medias && videoData.medias.length > 0) {
      const firstNonAudio = videoData.medias.find((m: any) => m.type !== 'audio' && m.url);
      if (firstNonAudio) {
        playUrl = firstNonAudio.url;
      }
    }

    return NextResponse.json({
      author: videoData.author || '',
      title: videoData.title || 'Instagram Gönderisi',
      cover: videoData.thumbnail || null,
      play: playUrl,
      music: audioMedia?.url || null,
      images: images.length > 0 ? images : null,
    });
  } catch (error) {
    console.error('Instagram API Hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası, lütfen tekrar deneyin.' }, { status: 500 });
  }
}
