import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Sorgu gerekli' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'YouTube araması başarısız' }, { status: 500 });
    }
    
    const html = await res.text();
    
    const results: { videoId: string; title: string; thumbnail: string; artist: string }[] = [];
    
    // We will extract video IDs and Titles. YouTube HTML structure is complex, 
    // but we can find pattern "videoId":"..." and "title":{"runs":[{"text":"..."}]}
    
    // Split the html into chunks to find individual video objects
    const chunks = html.split('"videoRenderer":{');
    
    for (let i = 1; i < chunks.length; i++) { // Skip the first chunk
      if (results.length >= 5) break; // Return top 5 results
      
      const chunk = chunks[i];
      const videoIdMatch = chunk.match(/"videoId":"([^"]+)"/);
      const titleMatch = chunk.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
      const ownerMatch = chunk.match(/"ownerText":\{"runs":\[\{"text":"([^"]+)"/);
      
      if (videoIdMatch && titleMatch) {
        const videoId = videoIdMatch[1];
        const title = titleMatch[1];
        const artist = ownerMatch ? ownerMatch[1] : "YouTube";
        
        // Ensure no duplicates
        if (!results.find(r => r.videoId === videoId)) {
          results.push({
            videoId,
            title,
            artist,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
          });
        }
      }
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'YouTube araması sırasında bilinmeyen hata';
    console.error('YouTube search failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
