"use client";

import { useState } from "react";
import Link from "next/link";

interface Song {
  artist: string;
  title: string;
  year: number | null;
  videoId: string | null;
  youtubeTitle: string | null;
  thumbnail: string | null;
}

interface Playlist {
  playlist_name: string;
  description: string;
  songs: Song[];
}

const MOOD_PRESETS = [
  { label: "Mutlu ve enerjik",   value: "mutlu enerjik dans şarkıları" },
  { label: "Sakin ve huzurlu",   value: "sakin huzurlu dinlendirici müzik" },
  { label: "Melankolik",         value: "melankolik hüzünlü duygusal şarkılar" },
  { label: "Odaklanma",          value: "odaklanma için instrumental çalışma müziği" },
  { label: "Gece sürüşü",        value: "gece sürüşü için lofi chill şarkılar" },
  { label: "Sabah rutini",       value: "sabah için pozitif enerjik şarkılar" },
  { label: "Türkçe pop",         value: "Türkçe pop şarkıları 2020 sonrası" },
  { label: "90'lar nostaljisi",  value: "90'lar Türkçe ve yabancı nostalji pop" },
];

function ThinkingBox({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div style={{ width: "100%", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "14px", padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isStreaming ? "#8b5cf6" : "#4ade80", animation: isStreaming ? "pulse 1s ease-in-out infinite" : "none" }} />
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: isStreaming ? "#a78bfa" : "#4ade80", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {isStreaming ? "Gemini düşünüyor..." : "Düşünce tamamlandı"}
        </span>
      </div>
      <p style={{ fontSize: "0.88rem", lineHeight: "1.7", color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap" }}>
        {text}
        {isStreaming && <span style={{ display: "inline-block", width: "2px", height: "1em", background: "#8b5cf6", marginLeft: "2px", animation: "blink 0.7s step-end infinite", verticalAlign: "text-bottom" }} />}
      </p>
    </div>
  );
}

export default function PlaylistPage() {
  const [prompt, setPrompt]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [playlist, setPlaylist]       = useState<Playlist | null>(null);
  const [songs, setSongs]             = useState<Song[]>([]);
  const [thinking, setThinking]       = useState("");
  const [isThinking, setIsThinking]   = useState(false);
  const [thinkingDone, setThinkingDone] = useState(false);
  const [statusMsg, setStatusMsg]     = useState("");
  const [error, setError]             = useState("");
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [downloaded, setDownloaded]   = useState<Record<number, boolean>>({});
  const [zipLoading, setZipLoading]   = useState(false);

  const handleGenerate = async (customPrompt?: string) => {
    const q = customPrompt || prompt;
    if (!q.trim()) return;
    setLoading(true); setError(""); setPlaylist(null); setSongs([]);
    setThinking(""); setIsThinking(true); setThinkingDone(false); setStatusMsg(""); setDownloaded({});
    try {
      const res = await fetch("/api/playlist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      if (!res.ok || !res.body) { const d = await res.json(); throw new Error(d.error || "Hata"); }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "thinking_chunk") {
              setThinking(prev => {
                const combined = prev + ev.text;
                const m = combined.match(/<thinking>([\s\S]*)/);
                return m ? m[1].replace(/<\/thinking>[\s\S]*$/, "") : combined.replace(/<thinking>/g, "");
              });
            } else if (ev.type === "thinking_done") {
              setThinking(ev.thinking || ""); setIsThinking(false); setThinkingDone(true);
            } else if (ev.type === "playlist_meta") {
              setPlaylist({ playlist_name: ev.name, description: ev.description, songs: [] });
            } else if (ev.type === "searching") {
              setStatusMsg(ev.message);
            } else if (ev.type === "song_found") {
              setSongs(prev => { const n = [...prev]; n[ev.index] = ev.song; return n; });
            } else if (ev.type === "done") {
              setSongs(ev.songs); setStatusMsg(""); setLoading(false);
            } else if (ev.type === "error") {
              throw new Error(ev.message);
            }
          } catch (_) {}
        }
      }
    } catch (err: any) {
      setError(err.message); setLoading(false); setIsThinking(false);
    }
  };

  const getMP3Url = async (videoId: string) => {
    try { const r = await fetch(`/api/playlist?videoId=${videoId}`); const d = await r.json(); return d.url || null; }
    catch { return null; }
  };

  const handleDownloadSingle = async (song: Song, idx: number) => {
    if (!song.videoId) return;
    setDownloading(d => ({ ...d, [idx]: true }));
    try {
      const mp3 = await getMP3Url(song.videoId);
      if (!mp3) throw new Error("MP3 linki alınamadı");
      const fn = `${song.artist} - ${song.title}.mp3`.replace(/[^\w\s\-_.]/g, "");
      const a = document.createElement("a");
      a.href = `/api/force-download?url=${encodeURIComponent(mp3)}&filename=${encodeURIComponent(fn)}`;
      a.download = fn; a.click();
      setDownloaded(d => ({ ...d, [idx]: true }));
    } catch (e: any) { alert("İndirme başarısız: " + e.message); }
    finally { setDownloading(d => ({ ...d, [idx]: false })); }
  };

  const handleDownloadAll = async () => {
    if (!songs.length) return;
    setZipLoading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder(playlist?.playlist_name || "playlist") as any;
      await Promise.all(songs.filter(s => s.videoId).map(async (song, idx) => {
        try {
          const mp3 = await getMP3Url(song.videoId!);
          if (!mp3) return;
          const res = await fetch(`/api/force-download?url=${encodeURIComponent(mp3)}&filename=t.mp3`);
          if (!res.ok) return;
          folder.file(`${idx+1}. ${song.artist} - ${song.title}.mp3`.replace(/[^\w\s\-_.]/g,""), await res.blob());
        } catch {}
      }));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${playlist?.playlist_name||"playlist"}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { alert("ZIP hatası: " + e.message); }
    finally { setZipLoading(false); }
  };

  const foundSongs = songs.filter(Boolean);
  const spin = { animation: "spin 1s linear infinite" } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", alignItems: "center", maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem 5rem" }}>
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ width: "70px", height: "70px", borderRadius: "18px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "0 8px 30px rgba(139,92,246,0.4)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 9l12-2"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>AI Playlist Oluşturucu</h1>
        <p className="subtitle" style={{ margin: 0 }}>Ne dinlemek istediğini söyle — Gemini senin için playlist hazırlasın.</p>
      </div>

      <div className="glass-panel" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ne dinlemek istiyorsun? Örn: hüzünlü Türkçe şarkılar, egzersiz müziği..." rows={3} disabled={loading}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", padding: "0.85rem 1rem", fontSize: "0.95rem", outline: "none", resize: "none", width: "100%", fontFamily: "inherit", lineHeight: "1.5", opacity: loading ? 0.6 : 1 }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !loading) { e.preventDefault(); handleGenerate(); } }} />
        <button onClick={() => handleGenerate()} disabled={loading || !prompt.trim()} className="btn"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)", fontSize: "1rem", padding: "0.9rem" }}>
          {loading ? <span style={{ display:"flex",alignItems:"center",gap:"0.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Oluşturuluyor...
          </span> : "Playlist Oluştur"}
        </button>
      </div>

      <div style={{ width: "100%" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Hızlı Seçimler</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {MOOD_PRESETS.map(p => (
            <button key={p.value} onClick={() => { setPrompt(p.value); handleGenerate(p.value); }} disabled={loading}
              style={{ padding: "0.45rem 0.9rem", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)", cursor: loading?"not-allowed":"pointer", fontSize: "0.82rem", fontWeight: 500, opacity: loading?0.5:1 }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {(isThinking || thinkingDone) && thinking && <ThinkingBox text={thinking} isStreaming={isThinking} />}

      {statusMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", opacity: 0.6 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <span style={{ fontSize: "0.85rem" }}>{statusMsg}</span>
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ width: "100%", border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)", padding: "1rem 1.5rem" }}>
          <p style={{ color: "#ef4444", textAlign: "center", fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {(playlist || foundSongs.length > 0) && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {playlist && (
            <div className="glass-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.3rem" }}>{playlist.playlist_name}</h2>
                <p style={{ opacity: 0.6, fontSize: "0.88rem" }}>{playlist.description}</p>
                <p style={{ opacity: 0.4, fontSize: "0.8rem", marginTop: "0.25rem" }}>{foundSongs.filter(s=>s.videoId).length} / 12 şarkı{loading && " · aranıyor..."}</p>
              </div>
              {!loading && foundSongs.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button onClick={handleDownloadAll} disabled={zipLoading} className="btn" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)", fontSize: "0.85rem", padding: "0.6rem 1.1rem" }}>
                    {zipLoading ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> : null}
                    {zipLoading ? " ZIP..." : "ZIP İndir"}
                  </button>
                  <button onClick={() => handleGenerate()} className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.6rem 1rem" }}>Yenile</button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {foundSongs.map((song, idx) => (
              <div key={idx} className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, opacity: 0.35, minWidth: "20px", textAlign: "center" }}>{idx + 1}</span>
                {song.thumbnail
                  ? <img src={song.thumbnail} alt={song.title} style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                  : <div style={{ width: "48px", height: "36px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{song.title}</div>
                  <div style={{ opacity: 0.55, fontSize: "0.78rem" }}>{song.artist}{song.year ? ` · ${song.year}` : ""}</div>
                </div>
                {song.videoId && (
                  <a href={`https://www.youtube.com/watch?v=${song.videoId}`} target="_blank" rel="noopener noreferrer" style={{ opacity: 0.4, flexShrink: 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
                {song.videoId ? (
                  <button onClick={() => handleDownloadSingle(song, idx)} disabled={downloading[idx]}
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.8rem", borderRadius: "7px",
                      border: downloaded[idx] ? "1px solid #4ade80" : "1px solid rgba(255,255,255,0.12)",
                      background: downloaded[idx] ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)",
                      color: downloaded[idx] ? "#4ade80" : "rgba(255,255,255,0.8)",
                      cursor: downloading[idx]?"wait":"pointer", fontSize: "0.78rem", fontWeight: 600, flexShrink: 0 }}>
                    {downloading[idx]
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      : downloaded[idx]
                        ? <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
                    {downloading[idx] ? " ..." : downloaded[idx] ? " İndirildi" : " MP3"}
                  </button>
                ) : <span style={{ fontSize: "0.75rem", opacity: 0.3, padding: "0.4rem 0.8rem" }}>Bulunamadı</span>}
              </div>
            ))}

            {loading && foundSongs.length < 12 && Array.from({ length: 12 - foundSongs.length }).map((_, i) => (
              <div key={`sk-${i}`} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", animation: "pulse-opacity 1.5s ease-in-out infinite" }}>
                <div style={{ width: "20px", height: "12px", borderRadius: "4px", background: "rgba(255,255,255,0.08)" }} />
                <div style={{ width: "48px", height: "36px", borderRadius: "6px", background: "rgba(255,255,255,0.06)" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ height: "12px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", width: "60%" }} />
                  <div style={{ height: "10px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes pulse-opacity { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
