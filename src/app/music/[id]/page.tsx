"use client";

import { useLibrary } from "@/hooks/useLibrary";
import { usePlayer, Track } from "@/context/PlayerContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { playlists, isLoaded, addTrackToPlaylist, removeTrackFromPlaylist } = useLibrary();
  const { setQueueAndPlay } = usePlayer();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{videoId: string, title: string, artist: string, thumbnail: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloaded, setDownloaded]   = useState<Record<string, boolean>>({});

  const playlist = playlists.find(p => p.id === id);

  useEffect(() => {
    if (isLoaded && !playlist) {
      router.push("/music");
    }
  }, [isLoaded, playlist, router]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (e) {
      console.error("Arama hatası", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = (result: any) => {
    if (!playlist) return;
    addTrackToPlaylist(playlist.id, {
      videoId: result.videoId,
      title: result.title,
      artist: result.artist,
      thumbnail: result.thumbnail
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const getMP3Url = async (videoId: string) => {
    try { const r = await fetch(`/api/playlist?videoId=${videoId}`); const d = await r.json(); return d.url || null; }
    catch { return null; }
  };

  const handleDownloadSingle = async (track: Track) => {
    if (!track.videoId) return;
    setDownloading(d => ({ ...d, [track.videoId]: true }));
    try {
      const mp3 = await getMP3Url(track.videoId);
      if (!mp3) throw new Error("MP3 linki alınamadı");
      const filename = `${track.artist} - ${track.title}.mp3`.replace(/[^a-zA-Z0-9\s\-_.]/g, "").trim();
      const a = document.createElement("a");
      a.href = mp3;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloaded(d => ({ ...d, [track.videoId]: true }));
    } catch (e: any) { alert("İndirme başarısız: " + e.message); }
    finally { setDownloading(d => ({ ...d, [track.videoId]: false })); }
  };

  if (!isLoaded || !playlist) return <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.7)" }}>Yükleniyor...</div>;

  return (
    <div className="glass-panel" style={{ padding: "2rem", position: "relative", overflow: "hidden", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(139, 92, 246, 0.4)", filter: "blur(60px)", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "150px", height: "150px", background: "rgba(236, 72, 153, 0.4)", filter: "blur(60px)", borderRadius: "50%", zIndex: 0 }} />
      
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/music" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Kütüphaneye Dön
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 className="title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{playlist.name}</h1>
            <p className="subtitle" style={{ fontSize: "0.95rem" }}>{playlist.description}</p>
            <p style={{ opacity: 0.5, fontSize: "0.85rem", marginTop: "0.25rem" }}>{playlist.tracks.length} Şarkı</p>
          </div>
          <button 
            onClick={() => setQueueAndPlay(playlist.tracks)}
            className="btn" 
            style={{ background: "#22c55e", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", borderRadius: "12px", color: "white", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Tümünü Oynat
          </button>
        </div>

        {/* Şarkı Ekle */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Şarkı Ekle
          </h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if(e.key === "Enter") handleSearch(); }}
              placeholder="Şarkı veya sanatçı ara..."
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.75rem 1rem", color: "white", outline: "none" }}
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "0 1.25rem", color: "white", fontWeight: 600, cursor: isSearching ? "wait" : "pointer", transition: "background 0.2s" }}
            >
              {isSearching ? "Aranıyor..." : "Ara"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {searchResults.map((res, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(0,0,0,0.2)", padding: "0.5rem", borderRadius: "8px" }}>
                  <img src={res.thumbnail} alt={res.title} style={{ width: "40px", height: "30px", objectFit: "cover", borderRadius: "4px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.title}</div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>{res.artist}</div>
                  </div>
                  <button 
                    onClick={() => handleAddTrack(res)}
                    style={{ background: "#22c55e", border: "none", borderRadius: "6px", padding: "0.4rem 0.8rem", color: "white", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    Ekle
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Şarkı Listesi */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {playlist.tracks.map((track, idx) => (
            <div key={track.videoId + idx} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, opacity: 0.35, minWidth: "20px", textAlign: "center" }}>{idx + 1}</span>
              {track.thumbnail
                ? <img src={track.thumbnail} alt={track.title} style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                : <div style={{ width: "48px", height: "36px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: "150px" }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{track.title}</div>
                <div style={{ opacity: 0.55, fontSize: "0.78rem" }}>{track.artist}</div>
              </div>
              
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button onClick={() => setQueueAndPlay(playlist.tracks, idx)}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.8rem", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Oynat
                </button>
                <button onClick={() => handleDownloadSingle(track)} disabled={downloading[track.videoId]}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.8rem", borderRadius: "7px",
                    border: downloaded[track.videoId] ? "1px solid #4ade80" : "1px solid rgba(255,255,255,0.12)",
                    background: downloaded[track.videoId] ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)",
                    color: downloaded[track.videoId] ? "#4ade80" : "rgba(255,255,255,0.8)",
                    cursor: downloading[track.videoId]?"wait":"pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                  {downloading[track.videoId]
                    ? "..." 
                    : downloaded[track.videoId]
                      ? "İndirildi"
                      : "MP3"}
                </button>
                <button onClick={() => removeTrackFromPlaylist(playlist.id, track.videoId)}
                  style={{ width: "32px", height: "32px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", cursor: "pointer" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          ))}
          {playlist.tracks.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
              Bu listede henüz şarkı yok. Yukarıdan şarkı ekleyebilirsiniz.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
