import { NextResponse } from "next/server";

// RapidAPI Key listesi (Pinterest ve Instagram ile aynı)
const RAPIDAPI_KEYS = [
  "cb858c97a3msh3798faa4195f2c4p1ce356jsnfed9edfcad6f",
  "adc4b7af04mshadb5aab86d5eff7p1946e8jsn61fbc4deba81",
  "550292b6c2msh6f03553b10bc495p15d293jsn1a8ef5f8e47f",
  "a25458b35dmshff7650f186959bcp12b071jsn8408bc851eb2",
  "f890c11bc2msh5d052433c7ad0d5p15925djsn5a5f8b7a00a3"
];

const RAPIDAPI_HOST = "twitter-video-downloader-api.p.rapidapi.com";

// Twitter syndication token calculation
function getToken(id: string) {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, '');
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "Lütfen geçerli bir Twitter/X bağlantısı girin." }, { status: 400 });
    }

    // Tweet ID'sini çekelim
    const match = url.match(/status\/(\d+)/);
    if (!match) {
      return NextResponse.json({ error: "Bağlantıda Tweet ID'si bulunamadı. Lütfen geçerli bir tweet linki girin." }, { status: 400 });
    }
    const tweetId = match[1];

    let lastError = "";

    // ── 1. YOL: RapidAPI Key Rotation (Birincil Yöntem) ──
    for (let i = 0; i < RAPIDAPI_KEYS.length; i++) {
      const key = RAPIDAPI_KEYS[i];
      try {
        const res = await fetch(`https://${RAPIDAPI_HOST}/download?url=${encodeURIComponent(url)}`, {
          method: "GET",
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": key
          },
          next: { revalidate: 60 }
        });

        if (res.status === 200) {
          const data = await res.json();
          // RapidAPI formatına göre parse et
          if (data && (data.videos || data.url)) {
            // Başarılı format
            const videoList = data.videos || [];
            const parsedVideos = videoList.map((v: any) => ({
              quality: v.quality || v.resolution || "Normal",
              url: v.url || v.downloadUrl
            }));

            // Kalite genişliğine göre (örn: 1280x720) azalan sırala (en yüksek kalite en üstte)
            parsedVideos.sort((a: any, b: any) => {
              const widthA = parseInt(a.quality.split("x")[0]) || parseInt(a.quality.replace(/[^\d]/g, "")) || 0;
              const widthB = parseInt(b.quality.split("x")[0]) || parseInt(b.quality.replace(/[^\d]/g, "")) || 0;
              return widthB - widthA;
            });

            return NextResponse.json({
              title: data.text || data.title || "Twitter Videosu",
              author: data.author || "Twitter Kullanıcısı",
              cover: data.thumb || data.thumbnail || null,
              videos: parsedVideos
            });
          }
        } else if (res.status === 403 || res.status === 429) {
          console.warn(`Twitter RapidAPI key index ${i} limitli veya abonesiz (Status: ${res.status}). Sonrakine geçiliyor...`);
          lastError = `RapidAPI Hatası: ${res.status === 403 ? "Abone olunmamış" : "Limit aşılmış"}`;
        }
      } catch (err: any) {
        console.error(`Twitter RapidAPI key index ${i} hatası:`, err.message);
        lastError = err.message;
      }
    }

    // ── 2. YOL: Fallback (Yedek Plan - Twitter Syndication API) ──
    console.log("RapidAPI başarısız oldu veya abonesiz. Syndication API deneniyor...");
    try {
      const token = getToken(tweetId);
      const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${token}&lang=tr`;
      
      const syndicationRes = await fetch(syndicationUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });

      if (syndicationRes.ok) {
        const data = await syndicationRes.json();
        if (data && data.mediaDetails) {
          const videos: any[] = [];
          let cover = null;

          data.mediaDetails.forEach((media: any) => {
            if (media.type === "video" || media.type === "animated_gif") {
              cover = media.media_url_https;
              if (media.video_info && media.video_info.variants) {
                media.video_info.variants.forEach((v: any) => {
                  if (v.content_type === "video/mp4") {
                    // Kaliteyi bitrate'den veya URL'den tahmin et
                    let quality = "Normal";
                    if (v.url.includes("/720x")) quality = "720p HD";
                    else if (v.url.includes("/1080x")) quality = "1080p Full HD";
                    else if (v.url.includes("/480x")) quality = "480p";
                    else if (v.url.includes("/360x")) quality = "360p";
                    else if (v.bitrate) {
                      if (v.bitrate > 2000000) quality = "1080p Full HD";
                      else if (v.bitrate > 1000000) quality = "720p HD";
                      else if (v.bitrate > 500000) quality = "480p";
                      else quality = "360p";
                    }

                    videos.push({
                      quality,
                      url: v.url,
                      bitrate: v.bitrate || 0
                    });
                  }
                });
              }
            }
          });

          if (videos.length > 0) {
            // Bitrate değerine göre sayısal olarak azalan sırala (en yüksek bitrate en üstte)
            videos.sort((a, b) => b.bitrate - a.bitrate);

            // Client'a gönderirken gereksiz bitrate bilgisini kaldırıp temiz listeyi dönelim
            const cleanedVideos = videos.map(v => ({
              quality: v.quality,
              url: v.url
            }));

            return NextResponse.json({
              title: data.text || "Twitter Videosu",
              author: data.user ? `${data.user.name} (@${data.user.screen_name})` : "Twitter Kullanıcısı",
              cover,
              videos: cleanedVideos
            });
          }
        }
      }
    } catch (fallbackErr: any) {
      console.error("Syndication fallback hatası:", fallbackErr.message);
    }

    // ── 3. YOL: Fallback 2 (FxTwitter API) ──
    console.log("Syndication başarısız oldu. FxTwitter API deneniyor...");
    try {
      const fxtwitterUrl = `https://api.fxtwitter.com/i/status/${tweetId}`;
      const fxRes = await fetch(fxtwitterUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (fxRes.ok) {
        const data = await fxRes.json();
        if (data && data.tweet && data.tweet.media && data.tweet.media.all) {
          const videos: any[] = [];
          let cover = null;

          data.tweet.media.all.forEach((media: any) => {
            if (media.type === "video" || media.type === "gif") {
              cover = media.thumbnail_url;
              if (media.url) {
                videos.push({
                  quality: "Yüksek Kalite (MP4)",
                  url: media.url
                });
              }
            }
          });

          if (videos.length > 0) {
            return NextResponse.json({
              title: data.tweet.text || "Twitter Videosu",
              author: `${data.tweet.author.name} (@${data.tweet.author.screen_name})`,
              cover,
              videos
            });
          }
        }
      }
    } catch (fxErr: any) {
      console.error("FxTwitter fallback hatası:", fxErr.message);
    }

    return NextResponse.json({
      error: "Video indirme linkleri alınamadı. Bu tweet gizli bir hesaba ait olabilir veya video içermiyor olabilir."
    }, { status: 404 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
