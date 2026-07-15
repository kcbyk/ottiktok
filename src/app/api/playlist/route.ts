import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEYS = process.env.GEMINI_KEYS ? process.env.GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean) : [];
const YTSTREAM_KEYS = process.env.RAPIDAPI_KEYS ? process.env.RAPIDAPI_KEYS.split(',').map(k => k.trim()).filter(Boolean) : [];

async function searchYouTube(query: string): Promise<{ videoId: string; title: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (!match) return null;
    const titleMatch = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"\}\]/);
    return { videoId: match[1], title: titleMatch ? titleMatch[1] : query };
  } catch { return null; }
}

async function getMP3(videoId: string): Promise<string | null> {
  const MP36_HOST = 'youtube-mp36.p.rapidapi.com';
  for (const key of YTSTREAM_KEYS) {
    try {
      const res = await fetch(`https://${MP36_HOST}/dl?id=${videoId}`, {
        headers: { 'x-rapidapi-host': MP36_HOST, 'x-rapidapi-key': key },
      });
      if (res.status === 429 || res.status === 403) continue;
      const data = await res.json();
      if (data?.status === 'ok' && data?.link) return data.link;
    } catch { continue; }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) return NextResponse.json({ error: 'Lütfen bir şey yazın.' }, { status: 400 });
    if (GEMINI_KEYS.length === 0) return NextResponse.json({ error: 'Gemini API anahtarları yapılandırılmamış.' }, { status: 503 });

    const geminiPrompt = `Sen bir müzik uzmanısın. Kullanıcının isteğine göre 12 şarkıdan oluşan bir playlist hazırla.

Kullanıcı isteği: "${prompt}"

Önce kısa bir düşünce süreci yaz (2-4 cümle), sonra JSON ver.

Format:
<thinking>
Düşünce süreci...
</thinking>
<json>
{
  "playlist_name": "Playlist adı",
  "description": "Kısa açıklama",
  "songs": [
    {"artist": "Sanatçı", "title": "Şarkı adı", "year": 2020}
  ]
}
</json>

Kurallar: Gerçek şarkılar, Türkçe istek varsa Türkçe şarkılar, sadece belirtilen format.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        try {
          let geminiText = '';
          let success = false;
          for (const key of GEMINI_KEYS) {
            try {
              const genAI = new GoogleGenerativeAI(key);
              const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
              const result = await model.generateContentStream(geminiPrompt);
              for await (const chunk of result.stream) {
                const t = chunk.text();
                geminiText += t;
                send({ type: 'thinking_chunk', text: t });
              }
              success = true;
              break;
            } catch (err: any) {
              if (err.status === 429 || err.status === 503 || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) continue;
              throw err;
            }
          }
          if (!success) throw new Error('Tüm Gemini key limitleri doldu');

          const thinkingMatch = geminiText.match(/<thinking>([\s\S]*?)<\/thinking>/);
          const jsonMatch = geminiText.match(/<json>([\s\S]*?)<\/json>/);
          const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';

          send({ type: 'thinking_done', thinking });

          let playlistData: any;
          try {
            playlistData = JSON.parse(jsonMatch ? jsonMatch[1].trim() : '{}');
          } catch {
            const fallback = geminiText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const m = fallback.match(/\{[\s\S]*\}/);
            playlistData = m ? JSON.parse(m[0]) : null;
          }
          if (!playlistData?.songs?.length) throw new Error('Playlist oluşturulamadı');

          send({ type: 'playlist_meta', name: playlistData.playlist_name, description: playlistData.description });
          send({ type: 'searching', message: "YouTube'da şarkılar aranıyor..." });

          const songs = await Promise.all(
            playlistData.songs.map(async (song: any, idx: number) => {
              const yt = await searchYouTube(`${song.artist} - ${song.title} official audio`);
              const result = {
                artist: song.artist, title: song.title, year: song.year || null,
                videoId: yt?.videoId || null, youtubeTitle: yt?.title || null,
                thumbnail: yt?.videoId ? `https://img.youtube.com/vi/${yt.videoId}/mqdefault.jpg` : null,
              };
              send({ type: 'song_found', index: idx, song: result });
              return result;
            })
          );

          send({ type: 'done', songs });
        } catch (err: any) {
          send({ type: 'error', message: err.message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  if (!videoId) return NextResponse.json({ error: 'videoId gerekli' }, { status: 400 });
  const mp3 = await getMP3(videoId);
  if (!mp3) return NextResponse.json({ error: 'MP3 linki alınamadı.' }, { status: 404 });
  return NextResponse.json({ url: mp3 });
}
