"use client";

import { useLibrary } from "@/hooks/useLibrary";
import { usePlayer } from "@/context/PlayerContext";
import Link from "next/link";

export default function MusicPage() {
  const { playlists, isLoaded, deletePlaylist } = useLibrary();
  const { setQueueAndPlay } = usePlayer();

  if (!isLoaded) return <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.7)" }}>Yükleniyor...</div>;

  return (
    <div className="glass-panel" style={{ padding: "2rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(139, 92, 246, 0.4)", filter: "blur(60px)", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "150px", height: "150px", background: "rgba(236, 72, 153, 0.4)", filter: "blur(60px)", borderRadius: "50%", zIndex: 0 }} />
      
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 className="title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Savio Müzik Platformu</h1>
            <p className="subtitle" style={{ fontSize: "0.95rem" }}>Kendi kütüphaneni yönet ve yapay zeka ile yeni listeler keşfet.</p>
          </div>
          <Link href="/playlist" className="btn" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", borderRadius: "12px", textDecoration: "none", color: "white", fontWeight: 600 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Yapay Zeka ile Liste Oluştur
          </Link>
        </div>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "white", marginBottom: "1rem" }}>Kütüphanem</h2>
        
        {playlists.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem" }}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            <h3 style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.5rem" }}>Henüz hiç liste kaydetmedin</h3>
            <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Yapay zeka ile moduna uygun bir liste oluştur ve hemen dinlemeye başla.</p>
            <Link href="/playlist" className="btn btn-secondary" style={{ padding: "0.6rem 1.2rem", textDecoration: "none", display: "inline-block" }}>Şimdi Oluştur</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {playlists.map(playlist => (
              <div key={playlist.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "1.25rem", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "1rem", transition: "transform 0.2s", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "white", marginBottom: "0.25rem" }}>{playlist.name}</h3>
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{playlist.description}</p>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                    {playlist.tracks.length} Şarkı
                  </span>
                  
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                      onClick={() => deletePlaylist(playlist.id)}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                      title="Sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    <button 
                      onClick={() => setQueueAndPlay(playlist.tracks)}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#22c55e", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)", transition: "transform 0.1s" }}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      title="Oynat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
