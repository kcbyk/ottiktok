import { NextResponse } from 'next/server';

const RAPIDAPI_HOST = 'pinterest-video-and-image-downloader.p.rapidapi.com';

// Çoklu API anahtarı desteği (Limit rotation)
const RAPIDAPI_KEYS = [
  'cb858c97a3msh3798faa4195f2c4p1ce356jsnfed9edfcad6f', // 1. Anahtar
  'adc4b7af04mshadb5aab86d5eff7p1946e8jsn61fbc4deba81', // 2. Anahtar
  '550292b6c2msh6f03553b10bc495p15d293jsn1a8ef5f8e47f', // 3. Anahtar
  'a25458b35dmshff7650f186959bcp12b071jsn8408bc851eb2', // 4. Anahtar
  'f890c11bc2msh5d052433c7ad0d5p15925djsn5a5f8b7a00a3', // 5. Anahtar (Kullanıcının eklediği)
  process.env.PINTEREST_RAPIDAPI_KEY,
  ...(process.env.RAPIDAPI_KEYS?.split(',') || [])
].filter((value, index, self) => value && self.indexOf(value) === index) as string[];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Kısa URL yönlendirmesini tarayıcı UA'i ile çöz
async function resolveRedirect(url: string): Promise<string> {
  if (!url.includes('pin.it')) return url;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });
    return res.url;
  } catch (e) {
    console.error('Redirect failed:', e);
    return url;
  }
}

// Profil bilgisi çıkarıcı
function extractProfileInfo(html: string) {
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/)?.[1]
    || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/)?.[1];
  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)?.[1]
    || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/)?.[1];
  const ogDescription = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/)?.[1]
    || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/)?.[1];

  const username = html.match(/\"username\":\"([^\"]+)\"/)?.[1];

  return { ogTitle, ogImage, ogDescription, username };
}

// Profildeki pinleri çıkarıcı
function extractPinsFromRedux(html: string): Array<{ id: string; pinUrl: string; thumbnail: string | null; title: string }> {
  const pwsMatch = html.match(/<script id="__PWS_INITIAL_PROPS__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!pwsMatch) return [];

  try {
    const data = JSON.parse(pwsMatch[1]);
    const reduxState = data.initialReduxState || {};
    const pins: any[] = [];

    const findPinsDeep = (obj: any, depth = 0) => {
      if (!obj || depth > 12) return;
      if (typeof obj === 'object') {
        if (obj.id && obj.images && (obj.images['236x'] || obj.images['736x'])) {
          const isBoard = obj.pin_count !== undefined || obj.board_id !== undefined || obj.section_count !== undefined;
          if (!isBoard) {
            pins.push({
              id: obj.id,
              pinUrl: `https://www.pinterest.com/pin/${obj.id}/`,
              thumbnail: obj.images['236x']?.url || obj.images['736x']?.url || obj.images['orig']?.url || null,
              title: obj.title || obj.description || 'Pinterest Medya',
            });
          }
        }
        for (const k in obj) {
          findPinsDeep(obj[k], depth + 1);
        }
      }
    };

    findPinsDeep(reduxState);

    const seen = new Set();
    const uniquePins = [];
    for (const p of pins) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        uniquePins.push(p);
      }
    }
    return uniquePins;
  } catch (e) {
    console.error('Redux parsing error:', e);
    return [];
  }
}

// Key Rotation ile Pinterest API İsteği
async function fetchPinterestWithRotation(url: string) {
  let lastError = null;

  for (let i = 0; i < RAPIDAPI_KEYS.length; i++) {
    const key = RAPIDAPI_KEYS[i];
    const apiUrl = `https://${RAPIDAPI_HOST}/pinterest?url=${encodeURIComponent(url)}`;
    
    try {
      console.log(`Pinterest API: Trying key index ${i}...`);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': key,
        },
        signal: AbortSignal.timeout(20000),
      });

      // Limit aşımı (429) veya yetkisiz/yasaklı (403) durumlarında bir sonraki key'e geç
      if (response.status === 429 || response.status === 403) {
        console.warn(`Pinterest API: Key index ${i} failed with status ${response.status}. Trying next key.`);
        lastError = { status: response.status, message: 'API limit aşımı.' };
        continue;
      }

      if (!response.ok) {
        lastError = { status: response.status, message: 'Sunucu yanıt vermedi.' };
        continue;
      }

      const data = await response.json();
      if (data && data.success) {
        return { success: true, data };
      } else {
        lastError = { status: 404, message: data?.error || 'Pinterest içeriği bulunamadı.' };
      }
    } catch (e: any) {
      console.error(`Pinterest API: Error with key index ${i}:`, e.message);
      lastError = { status: 500, message: e.message };
    }
  }

  return { success: false, error: lastError || { status: 500, message: 'Tüm API limitleri doldu.' } };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Lütfen bir Pinterest linki girin.' }, { status: 400 });
    }

    if (!url.includes('pinterest.com') && !url.includes('pin.it')) {
      return NextResponse.json({ error: 'Lütfen geçerli bir Pinterest linki girin.' }, { status: 400 });
    }

    if (RAPIDAPI_KEYS.length === 0) {
      return NextResponse.json({ error: 'Pinterest API anahtarı yapılandırılmamış.' }, { status: 503 });
    }

    // 1. Kısa link veya normal yönlendirmeyi çöz
    const resolvedUrl = await resolveRedirect(url.trim());
    
    // Asıl pin ID'sini çıkartarak temiz pin URL'sini elde et
    const pinIdMatch = resolvedUrl.match(/\/pin\/(\d+)/);
    const cleanPinUrl = pinIdMatch ? `https://www.pinterest.com/pin/${pinIdMatch[1]}/` : resolvedUrl;
    
    console.log('Unified Pinterest API: resolvedUrl =', resolvedUrl, 'cleanPinUrl =', cleanPinUrl);

    // 2. URL'nin pin mi yoksa profil mi olduğunu tespit et
    const isPin = resolvedUrl.includes('/pin/');

    if (isPin) {
      // ════════════ TEK PIN MODU (Rotation'lı) ════════════
      const apiResult = await fetchPinterestWithRotation(cleanPinUrl);

      if (!apiResult.success) {
        return NextResponse.json(
          { error: apiResult.error?.message || `Pinterest gönderisi bulunamadı veya limit doldu.` },
          { status: apiResult.error?.status || 500 }
        );
      }

      const data = apiResult.data;
      const pinData = data.data;

      // Pinner (profil) bilgisini çöz
      let pinnerUrl: string | null = null;
      let pinnerUsername: string | null = null;
      try {
        const pinRes = await fetch(cleanPinUrl, {
          headers: HEADERS,
          signal: AbortSignal.timeout(8000),
        });
        const html = await pinRes.text();
        
        // 1. Önce creator (asıl içerik üreticisi) bilgisini ara
        const creatorMatch = html.match(/"creator":\s*\{[^}]*?"alternateName":"([^"]+)"/) ||
                             html.match(/"creator":\s*\{[^}]*?"url":"https:\/\/www\.pinterest\.com\/([^"\/]+)\/?"/);
        if (creatorMatch) {
          pinnerUsername = creatorMatch[1];
          pinnerUrl = `https://www.pinterest.com/${pinnerUsername}/`;
        } else {
          // 2. Bulunamazsa pinner (panoya kaydeden) bilgisini ara
          const metaMatch = html.match(/<meta[^>]+(?:name|property)="pinterestapp:pinner"[^>]*>/) || 
                            html.match(/<meta[^>]+content="[^"]+"[^>]+(?:name|property)="pinterestapp:pinner"[^>]*>/);

          if (metaMatch) {
            const contentMatch = metaMatch[0].match(/content="([^"]+)"/);
            if (contentMatch) {
              pinnerUrl = contentMatch[1].replace(/\/$/, '') + '/';
              pinnerUsername = pinnerUrl.split('/').filter(Boolean).pop() || null;
            }
          }
        }
      } catch {
        // Hata durumunda devam et
      }

      const medias: Array<{ url: string; quality: string; type: 'video' | 'image' }> = [];

      if (data.type === 'video' && pinData.url) {
        const quality = pinData.width && pinData.height ? `${pinData.width}×${pinData.height}` : 'MP4';
        medias.push({ url: pinData.url, quality, type: 'video' });
      } else if (data.type === 'carousel' && pinData.pages && Array.isArray(pinData.pages)) {
        for (const page of pinData.pages) {
          if (page.url) {
            medias.push({ url: page.url, quality: page.type === 'video' ? 'Video' : 'Fotoğraf', type: page.type === 'video' ? 'video' : 'image' });
          }
        }
      } else if (data.type === 'image' || (!pinData.url?.includes('.mp4') && pinData.thumbnail)) {
        const imgUrl = pinData.url || pinData.thumbnail;
        if (imgUrl) medias.push({ url: imgUrl, quality: 'Fotoğraf', type: 'image' });
      }

      if (medias.length === 0 && pinData.thumbnail) {
        medias.push({ url: pinData.thumbnail, quality: 'Fotoğraf', type: 'image' });
      }

      return NextResponse.json({
        mode: 'pin',
        pinResult: {
          title: pinData.title || null,
          cover: pinData.thumbnail || null,
          medias,
          pinner: pinnerUsername ? { username: pinnerUsername, profileUrl: pinnerUrl } : null,
        }
      });

    } else {
      // ════════════ PROFİL MODU ════════════
      let profileUrl = resolvedUrl;

      // URL'yi temizle
      try {
        const cleanUrl = profileUrl.replace('https://', '').replace('http://', '');
        const parts = cleanUrl.split('/').filter(Boolean);
        if (parts.length >= 2 && parts[0].includes('pinterest.com')) {
          const username = parts[1];
          profileUrl = `https://www.pinterest.com/${username}/`;
        }
      } catch (e) {
        console.error('URL normalization failed:', e);
      }

      const response = await fetch(profileUrl, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Profil bulunamadı veya erişilemedi.' }, { status: 404 });
      }

      const html = await response.text();
      const { ogTitle, ogImage, ogDescription, username } = extractProfileInfo(html);
      const pins = extractPinsFromRedux(html);

      if (pins.length === 0) {
        return NextResponse.json({
          error: 'Bu profil kamuya açık değil veya hiç pin bulunamadı.',
        }, { status: 404 });
      }

      return NextResponse.json({
        mode: 'profile',
        profileResult: {
          profile: {
            name: ogTitle?.replace(' on Pinterest', '').replace(' | Pinterest', '').trim() || username || 'Pinterest Kullanıcısı',
            username: username || profileUrl.split('/').filter(Boolean).pop() || '',
            avatar: ogImage || null,
            description: ogDescription || null,
            profileUrl,
          },
          pins,
          total: pins.length,
        }
      });
    }

  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json({ error: 'Bağlantı zaman aşımına uğradı, lütfen tekrar deneyin.' }, { status: 504 });
    }
    console.error('Unified Pinterest route error:', error);
    return NextResponse.json({ error: 'Sunucu hatası, lütfen tekrar deneyin.' }, { status: 500 });
  }
}
