"use client";

import { useLibrary } from "@/hooks/useLibrary";
import { usePlayer } from "@/context/PlayerContext";
import Link from "next/link";
import { useState } from "react";

export default function MusicPage() {
  const { playlists, isLoaded, deletePlaylist, savePlaylist } = useLibrary();
  const { setQueueAndPlay } = usePlayer();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const pl = savePlaylist(newName.trim(), newDesc.trim() || "Kişisel playlist", []);
    setNewName("");
    setNewDesc("");
    setShowCreateModal(false);
    // Go directly to the playlist to start adding songs
    window.location.href = `/music/${pl.id}`;
  };

  if (!isLoaded) return <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.7)" }}>Yükleniyor...</div>;

  return (
    <div className="glass-panel" style={{ padding: "2rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(139, 92, 246, 0.4)", filter: "blur(60px)", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "150px", height: "150px", background: "rgba(236, 72, 153, 0.4)", filter: "blur(60px)", borderRadius: "50%", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 className="title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Savio Müzik Platformu</h1>
            <p className="subtitle" style={{ fontSize: "0.95rem" }}>Kendi kütüphaneni yönet ve yapay zeka ile yeni listeler keşfet.</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Manuel Liste Oluştur */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.2rem", borderRadius: "12px", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Liste Oluştur
            </button>
            {/* AI Liste */}
            <Link href="/playlist" className="btn" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.2rem", borderRadius: "12px", textDecoration: "none", color: "white", fontWeight: 600, fontSize: "0.9rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l2 2"/><path d="M18 2v4h4"/></svg>
              AI ile Liste Oluştur
            </Link>
          </div>
        </div>

        {/* Library Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "white", margin: 0 }}>Kütüphanem</h2>
          <Link href="/listening-room" className="btn" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1rem", borderRadius: "10px", color: "white", textDecoration: "none", fontWeight: 600, fontSize: "0.84rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            Birlikte Dinle
          </Link>
        </div>

        {playlists.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", display: "block" }}>
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <h3 style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.5rem" }}>Henüz hiç liste yok</h3>
            <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Kendi listeni oluştur veya yapay zeka ile yeni listeler keşfet.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setShowCreateModal(true)} style={{ padding: "0.6rem 1.2rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", color: "white", cursor: "pointer", fontWeight: 600 }}>
                Manuel Liste Oluştur
              </button>
              <Link href="/playlist" style={{ padding: "0.6rem 1.2rem", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", borderRadius: "10px", color: "white", textDecoration: "none", fontWeight: 600 }}>
                AI ile Oluştur
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                onClick={() => window.location.href = `/music/${playlist.id}`}
                style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "1.25rem", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "1rem", transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                {/* Cover gradient */}
                <div style={{ width: "100%", height: "80px", borderRadius: "10px", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "white", marginBottom: "0.25rem" }}>{playlist.name}</h3>
                  <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{playlist.description}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{playlist.tracks.length} Şarkı</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={e => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                      style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                      title="Sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setQueueAndPlay(playlist.tracks); }}
                      disabled={playlist.tracks.length === 0}
                      style={{ width: "34px", height: "34px", borderRadius: "50%", background: playlist.tracks.length === 0 ? "rgba(255,255,255,0.08)" : "#22c55e", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: playlist.tracks.length === 0 ? "default" : "pointer", boxShadow: playlist.tracks.length === 0 ? "none" : "0 4px 12px rgba(34,197,94,0.3)", transition: "transform 0.1s" }}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      title="Oynat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Playlist Modal ── */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "rgba(15,15,30,0.98)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", padding: "2rem", width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
          >
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>Yeni Liste Oluştur</h2>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Listeyi oluşturduktan sonra şarkı arayıp ekleyebilirsin.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.4rem" }}>Liste Adı *</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                  placeholder="örn. Sabah Enerjisi"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.4rem" }}>Açıklama (opsiyonel)</label>
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                  placeholder="örn. Güne iyi başlamak için..."
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", outline: "none", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ flex: 1, padding: "0.75rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontWeight: 600 }}
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                style={{ flex: 2, padding: "0.75rem", background: newName.trim() ? "linear-gradient(135deg,#8b5cf6,#ec4899)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", color: "white", cursor: newName.trim() ? "pointer" : "default", fontWeight: 700, fontSize: "0.95rem" }}
              >
                Oluştur & Şarkı Ekle →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
