"use client";

import { useLibrary } from "@/hooks/useLibrary";
import { usePlayer } from "@/context/PlayerContext";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

function ListeningRoomContent() {
  const { playlists, isLoaded } = useLibrary();
  const {
    currentTrack, isPlaying,
    listeningRoomId, listeningRoomParticipants, listeningRoomConnection,
    createListeningRoom, joinListeningRoom, leaveListeningRoom,
  } = usePlayer();

  const params = useSearchParams();
  const [selected, setSelected] = useState("");
  const [roomLink, setRoomLink] = useState("");
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-join if ?room=... in URL
  useEffect(() => {
    const room = params.get("room");
    if (room && !listeningRoomId) {
      void joinListeningRoom(room).catch((e) => setMessage(e.message));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleCreate = async () => {
    const playlist = playlists.find((p) => p.id === selected);
    if (!playlist) return setMessage("Önce bir playlist seçin.");
    if (playlist.tracks.length === 0) return setMessage("Seçilen listede şarkı yok. Önce şarkı ekleyin.");
    setIsCreating(true);
    setMessage("");
    try {
      const id = await createListeningRoom({ id: playlist.id, name: playlist.name, tracks: playlist.tracks });
      setRoomLink(`${window.location.origin}/listening-room?room=${id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Oda oluşturulamadı");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    const link = roomLink || (listeningRoomId ? `${window.location.origin}/listening-room?room=${listeningRoomId}` : "");
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isLoaded) return <div className="glass-panel" style={{ padding: "2rem", textAlign: "center" }}>Yükleniyor...</div>;

  const activeLink = roomLink || (listeningRoomId ? `${window.location.origin}/listening-room?room=${listeningRoomId}` : "");

  return (
    <div className="glass-panel" style={{ padding: "2rem", maxWidth: "680px", margin: "0 auto", position: "relative", overflow: "hidden" }}>
      {/* Bg glow */}
      <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", background: "rgba(6,182,212,0.3)", filter: "blur(70px)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "200px", height: "200px", background: "rgba(139,92,246,0.3)", filter: "blur(70px)", borderRadius: "50%", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Back */}
        <Link href="/music" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Kütüphaneye Dön
        </Link>

        {/* Title */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" opacity="0.3"/><circle cx="12" cy="12" r="6" opacity="0.6"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <h1 className="title" style={{ fontSize: "1.6rem" }}>Birlikte Dinle</h1>
          </div>
          <p className="subtitle" style={{ fontSize: "0.92rem" }}>
            Bir playlist seç, odayı oluştur ve bağlantıyı arkadaşlarınla paylaş — aynı anda senkronize dinleyin.
          </p>
        </div>

        {/* ── NOT IN A ROOM ── */}
        {!listeningRoomId ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {playlists.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>Önce kütüphanende en az bir playlist olması gerekiyor.</p>
                <Link href="/music" style={{ display: "inline-block", padding: "0.6rem 1.2rem", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", borderRadius: "10px", color: "white", textDecoration: "none", fontWeight: 600 }}>
                  Kütüphaneye Git
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.5rem" }}>Playlist Seç</label>
                  <select
                    value={selected}
                    onChange={e => setSelected(e.target.value)}
                    style={{ width: "100%", padding: "0.9rem 1rem", borderRadius: "12px", background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.12)", fontSize: "0.95rem", outline: "none", appearance: "none" }}
                  >
                    <option value="" style={{ background: "#111" }}>— Playlist seçin —</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id} style={{ background: "#111" }}>
                        {p.name} · {p.tracks.length} şarkı
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!selected || isCreating}
                  style={{
                    width: "100%", padding: "0.9rem",
                    background: selected && !isCreating ? "linear-gradient(135deg,#06b6d4,#8b5cf6)" : "rgba(255,255,255,0.08)",
                    color: "white", border: "none", borderRadius: "12px",
                    fontWeight: 700, fontSize: "1rem",
                    cursor: selected && !isCreating ? "pointer" : "default",
                    transition: "background 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  }}
                >
                  {isCreating ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Oda Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Oda Oluştur
                    </>
                  )}
                </button>
              </>
            )}

            {message && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", color: "#f87171", fontSize: "0.9rem" }}>
                {message}
              </div>
            )}
          </div>
        ) : (
          /* ── IN A ROOM ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Status card */}
            <div style={{ padding: "1.25rem", borderRadius: "14px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: listeningRoomConnection === "connected" ? "#4ade80" : "#facc15", boxShadow: listeningRoomConnection === "connected" ? "0 0 8px #4ade80" : "0 0 8px #facc15", animation: "pulse 2s infinite" }} />
                <span style={{ fontWeight: 700, color: "#67e8f9" }}>Oda Aktif</span>
                <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                  {listeningRoomParticipants} kişi bağlı
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: listeningRoomConnection === "connected" ? "#4ade80" : "#facc15" }}>
                {listeningRoomConnection === "connected" ? "● Gerçek zamanlı bağlı (WebSocket)" : "◌ Yedek senkronizasyon aktif (Polling)"}
              </div>
              {currentTrack && (
                <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.75rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)" }}>
                  🎵 {isPlaying ? "Oynatılıyor:" : "Duraklatıldı:"} <strong>{currentTrack.title}</strong> — {currentTrack.artist}
                </div>
              )}
            </div>

            {/* Invite link */}
            <div>
              <label style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.5rem" }}>Davet Bağlantısı</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  readOnly
                  value={activeLink}
                  onFocus={e => e.currentTarget.select()}
                  style={{ flex: 1, padding: "0.8rem 1rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "rgba(255,255,255,0.8)", fontSize: "0.82rem", outline: "none" }}
                />
                <button
                  onClick={handleCopy}
                  style={{ padding: "0 1.25rem", background: copied ? "#22c55e" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", transition: "background 0.2s", flexShrink: 0 }}
                >
                  {copied ? "Kopyalandı ✓" : "Kopyala"}
                </button>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: "0.9rem 1rem", background: "rgba(255,255,255,0.03)", borderRadius: "10px", fontSize: "0.84rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              💡 Bağlantıyı arkadaşlarına gönder — aynı linke girerlerse müzik otomatik senkronize olur.
            </div>

            <button
              onClick={leaveListeningRoom}
              style={{ alignSelf: "flex-start", background: "transparent", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", padding: "0.55rem 1.1rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}
            >
              Odadan Ayrıl
            </button>

            {message && (
              <div style={{ color: "#f87171", fontSize: "0.9rem" }}>{message}</div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      ` }} />
    </div>
  );
}

export default function ListeningRoomPage() {
  return (
    <Suspense fallback={<div className="glass-panel" style={{ padding: "2rem", textAlign: "center" }}>Yükleniyor...</div>}>
      <ListeningRoomContent />
    </Suspense>
  );
}