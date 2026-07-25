"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLibrary } from "@/hooks/useLibrary";
import type { Track } from "@/context/PlayerContext";
import Pusher from "pusher-js";

// ─── Anonymous user ID ────────────────────────────────────────────────────────
function getUID(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("savio_user_id");
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    localStorage.setItem("savio_user_id", id);
  }
  return id;
}

async function rfetch(path: string, opts: RequestInit = {}) {
  return fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-savio-user": getUID(),
      ...(opts.headers ?? {}),
    },
  });
}

function fmt(s: number) {
  if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface RoomState {
  code: string;
  hostId: string;
  playlist: { id: string; name: string; tracks: Track[] };
  trackIndex: number;
  isPlaying: boolean;
  startedAt: number;  // server-ms: "track position was 0 at this server time"
  pausedAt: number;   // seconds position when paused
  updatedAt: number;
  participants: string[];
}

type Screen = "home" | "create" | "join" | "room";

export default function ListeningRoomPage() {
  const { playlists, isLoaded } = useLibrary();
  const userId = getUID();

  // Navigation
  const [screen, setScreen] = useState<Screen>("home");
  const [error, setError] = useState("");

  // Audio Unlocked (iOS / Mobile Fix)
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Create flow
  const [selectedPl, setSelectedPl] = useState("");
  const [creating, setCreating] = useState(false);

  // Join flow
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [joining, setJoining] = useState(false);
  const d0 = useRef<HTMLInputElement>(null);
  const d1 = useRef<HTMLInputElement>(null);
  const d2 = useRef<HTMLInputElement>(null);
  const d3 = useRef<HTMLInputElement>(null);

  // Room State
  const [room, setRoom] = useState<RoomState | null>(null);
  const roomRef = useRef<RoomState | null>(null);
  useEffect(() => { roomRef.current = room; }, [room]);

  // Audio State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadingVidRef = useRef("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [localPos, setLocalPos] = useState(0);
  const [duration, setDuration] = useState(0);

  // Song search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);

  // Copy code feedback
  const [codeCopied, setCodeCopied] = useState(false);

  const isHost = room?.hostId === userId;
  const tracks = room?.playlist.tracks ?? [];
  const currentTrack = tracks[room?.trackIndex ?? -1] ?? null;

  // ─────────────────────────────────────────────────────────────────────────
  // iOS / Mobile Audio Unlocker
  // Mobile Safari blocks programmatic audio.play() unless unlocked by user gesture.
  // ─────────────────────────────────────────────────────────────────────────
  const unlockAudio = useCallback(() => {
    if (audioUnlocked || !audioRef.current) return;
    const a = audioRef.current;
    // Play a tiny silent buffer
    a.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    a.play().then(() => {
      a.pause();
      setAudioUnlocked(true);
    }).catch(() => {});
  }, [audioUnlocked]);

  useEffect(() => {
    const handleGesture = () => {
      unlockAudio();
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("click", handleGesture);
    };
    window.addEventListener("touchstart", handleGesture, { once: true });
    window.addEventListener("click", handleGesture, { once: true });
    return () => {
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("click", handleGesture);
    };
  }, [unlockAudio]);

  // ─────────────────────────────────────────────────────────────────────────
  // Setup Audio Object
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    // Mobile optimization: allow inline playback
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");

    audio.addEventListener("timeupdate", () => setLocalPos(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(isFinite(audio.duration) ? audio.duration : 0));
    audio.addEventListener("ended", () => {
      const r = roomRef.current;
      if (!r || r.hostId !== getUID()) return;
      const nextIdx = r.trackIndex + 1;
      if (nextIdx < r.playlist.tracks.length) {
        void doUpdate({ trackIndex: nextIdx, isPlaying: true, startedAt: Date.now(), pausedAt: 0 }, r.code);
      } else {
        void doUpdate({ isPlaying: false, pausedAt: audio.currentTime }, r.code);
      }
    });
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; audioRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Fast Polling Sync Backup (every 1.5s for seamless room state)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!room?.code) return;
    const code = room.code;
    const poll = async () => {
      try {
        const res = await rfetch(`/api/listening-room?code=${code}`);
        if (res.ok) applyRoom(await res.json());
      } catch { /* ignore */ }
    };
    poll();
    const timer = setInterval(poll, 1500);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.code]);

  // ─────────────────────────────────────────────────────────────────────────
  // High Precision Local Clock Ticker (smooth slider & exact pos tracking)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!room?.isPlaying) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      const r = roomRef.current;
      if (!audio || !r || !r.isPlaying || audio.paused) return;

      const targetPos = Math.max(0, (Date.now() - r.startedAt) / 1000);
      const diff = Math.abs(audio.currentTime - targetPos);

      // Micro sync adjustment without jumps
      if (diff > 1.5) {
        audio.currentTime = targetPos;
      } else if (diff > 0.1) {
        audio.playbackRate = targetPos > audio.currentTime ? 1.05 : 0.95;
      } else {
        audio.playbackRate = 1.0;
      }
    }, 300);

    return () => clearInterval(interval);
  }, [room?.isPlaying]);

  // ─────────────────────────────────────────────────────────────────────────
  // Apply Room State
  // ─────────────────────────────────────────────────────────────────────────
  const applyRoom = useCallback((r: RoomState) => {
    setRoom(r);
    const audio = audioRef.current;
    if (!audio) return;

    const track = r.playlist.tracks[r.trackIndex];
    if (!track) return;

    const targetPos = r.isPlaying
      ? Math.max(0, (Date.now() - r.startedAt) / 1000)
      : r.pausedAt;

    if (track.videoId !== loadingVidRef.current) {
      void loadAudio(track, targetPos, r.isPlaying);
    } else {
      if (r.isPlaying && audio.paused) {
        audio.play().catch(() => {});
      } else if (!r.isPlaying && !audio.paused) {
        audio.pause();
        audio.currentTime = r.pausedAt;
        audio.playbackRate = 1.0;
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Load Audio Stream
  // ─────────────────────────────────────────────────────────────────────────
  const loadAudio = async (track: Track, seekTo = 0, autoplay = true) => {
    const audio = audioRef.current;
    if (!audio) return;
    loadingVidRef.current = track.videoId;
    setAudioLoading(true);
    audio.pause();
    audio.src = "";
    try {
      let url = "";
      const r1 = await fetch(`/api/playlist?videoId=${track.videoId}`);
      if (r1.ok) { const d1 = await r1.json(); url = d1.audioUrl || d1.url || ""; }
      if (!url) {
        const r2 = await fetch(`/api/youtube-media/stream?videoId=${track.videoId}`);
        if (r2.ok) { const d2 = await r2.json(); url = d2.url || d2.audioUrl || ""; }
      }
      if (!url) throw new Error("URL alınamadı");
      audio.src = url;
      audio.load();
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener("canplay", () => resolve(), { once: true });
        audio.addEventListener("error", () => reject(), { once: true });
      });
      audio.currentTime = seekTo;
      if (autoplay) await audio.play().catch(() => {});
    } catch (e) {
      console.error("loadAudio error", e);
    } finally {
      setAudioLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Send Room Update
  // ─────────────────────────────────────────────────────────────────────────
  const doUpdate = async (update: Record<string, unknown>, overrideCode?: string) => {
    const code = overrideCode ?? room?.code;
    if (!code) return;
    try {
      const res = await rfetch("/api/listening-room", {
        method: "PATCH",
        body: JSON.stringify({ code, update }),
      });
      if (res.ok) setRoom(await res.json());
    } catch { /* ignore */ }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Controls
  // ─────────────────────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    unlockAudio();
    const audio = audioRef.current;
    if (!audio || !room) return;
    const now = Date.now();
    if (room.isPlaying) {
      const pos = audio.currentTime;
      void doUpdate({ isPlaying: false, pausedAt: pos });
    } else {
      const startedAt = now - room.pausedAt * 1000;
      void doUpdate({ isPlaying: true, startedAt, pausedAt: room.pausedAt });
    }
  };

  const handleSelectTrack = (index: number) => {
    unlockAudio();
    if (!room) return;
    void doUpdate({ trackIndex: index, isPlaying: true, startedAt: Date.now(), pausedAt: 0 });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !room) return;
    const seekPos = Number(e.target.value);
    audio.currentTime = seekPos;
    const now = Date.now();
    if (room.isPlaying) {
      void doUpdate({ startedAt: now - seekPos * 1000 });
    } else {
      void doUpdate({ pausedAt: seekPos });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Create / Join Room
  // ─────────────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    unlockAudio();
    const pl = playlists.find(p => p.id === selectedPl);
    if (!pl) return setError("Playlist seçin.");
    setCreating(true); setError("");
    try {
      const res = await rfetch("/api/listening-room", {
        method: "POST",
        body: JSON.stringify({ action: "create", playlist: { id: pl.id, name: pl.name, tracks: pl.tracks } }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Hata");
      setRoom(await res.json());
      setScreen("room");
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    finally { setCreating(false); }
  };

  const handleJoin = async () => {
    unlockAudio();
    const code = digits.join("");
    if (code.length < 4) return setError("4 haneli kodu girin.");
    setJoining(true); setError("");
    try {
      const res = await rfetch("/api/listening-room", {
        method: "POST",
        body: JSON.stringify({ action: "join", code }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Oda bulunamadı");
      setRoom(await res.json());
      setScreen("room");
    } catch (e) { setError(e instanceof Error ? e.message : "Oda bulunamadı"); }
    finally { setJoining(false); }
  };

  const handleDigit = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits]; next[i] = v; setDigits(next);
    const refs = [d0, d1, d2, d3];
    if (v && i < 3) refs[i + 1].current?.focus();
    if (!v && i > 0) refs[i - 1].current?.focus();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Search Tracks
  // ─────────────────────────────────────────────────────────────────────────
  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(searchQ)}`);
      if (res.ok) setSearchResults((await res.json()).results || []);
    } catch { /**/ } finally { setSearching(false); }
  };

  const addTrack = (t: Track) => {
    void doUpdate({ addTrack: t });
    setShowSearch(false); setSearchQ(""); setSearchResults([]);
  };

  const removeTrack = (i: number) => void doUpdate({ removeTrackIndex: i });

  const handleLeave = async () => {
    if (room) await rfetch(`/api/listening-room?code=${room.code}`, { method: "DELETE" });
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = "";
    loadingVidRef.current = "";
    setRoom(null); setLocalPos(0); setDuration(0);
    setScreen("home");
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // Shared Styles
  const card: React.CSSProperties = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "1.25rem" };
  const inp: React.CSSProperties = { width: "100%", padding: "0.8rem 1rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", outline: "none", fontSize: "0.95rem", boxSizing: "border-box" };
  const btnP: React.CSSProperties = { width: "100%", padding: "0.85rem", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer" };
  const btnS: React.CSSProperties = { padding: "0.6rem 1.1rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer" };

  if (!isLoaded) return <div className="glass-panel" style={{ padding: "2rem", textAlign: "center" }}>Yükleniyor...</div>;

  // ════════════════ HOME ════════════════════════════════════════════════════
  if (screen === "home") return (
    <div className="glass-panel" style={{ padding: "2.5rem 2rem", maxWidth: 500, margin: "0 auto", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, background: "rgba(6,182,212,0.2)", filter: "blur(70px)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 180, height: 180, background: "rgba(139,92,246,0.2)", filter: "blur(70px)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Link href="/music" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.85rem" }}>← Kütüphaneye Dön</Link>
        <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "1.5rem auto 1rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10" opacity="0.25"/><circle cx="12" cy="12" r="6" opacity="0.5"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Birlikte Dinle</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.92rem", marginBottom: "0.75rem", lineHeight: 1.6 }}>Oda oluştur ve 4 haneli kodu arkadaşlarınla paylaş.</p>
        
        {/* iOS Support Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "0.35rem 0.75rem", marginBottom: "2rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
          <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 600 }}>iOS iPhone Uyumlu & Kesintisiz Canlı Senkronizasyon</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <button onClick={() => { setScreen("create"); setError(""); }} style={{ ...btnP, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Oda Oluştur
          </button>
          <button onClick={() => { setScreen("join"); setError(""); setDigits(["","","",""]); }} style={{ ...btnP, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Odaya Katıl
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════ CREATE ══════════════════════════════════════════════════
  if (screen === "create") return (
    <div className="glass-panel" style={{ padding: "2rem", maxWidth: 500, margin: "0 auto" }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.5rem", padding: 0 }}>← Geri</button>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.4rem" }}>Oda Oluştur</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>Kütüphanendeki bir playlistle oda kur.</p>
      {playlists.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1.5rem", ...card }}>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>Kütüphanende playlist yok.</p>
          <Link href="/music" style={{ ...btnS, textDecoration: "none", display: "inline-block" }}>Playlist Oluştur</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.5rem" }}>Playlist Seç</label>
            <select value={selectedPl} onChange={e => setSelectedPl(e.target.value)} style={{ ...inp, appearance: "none" }}>
              <option value="" style={{ background: "#111" }}>— Seçin —</option>
              {playlists.map(p => <option key={p.id} value={p.id} style={{ background: "#111" }}>{p.name} · {p.tracks.length} şarkı</option>)}
            </select>
          </div>
          {error && <div style={{ color: "#f87171", fontSize: "0.88rem" }}>{error}</div>}
          <button onClick={handleCreate} disabled={!selectedPl || creating} style={{ ...btnP, opacity: !selectedPl || creating ? 0.6 : 1 }}>
            {creating ? "Oluşturuluyor..." : "Oda Oluştur →"}
          </button>
        </div>
      )}
    </div>
  );

  // ════════════════ JOIN ════════════════════════════════════════════════════
  if (screen === "join") return (
    <div className="glass-panel" style={{ padding: "2rem", maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.5rem", padding: 0 }}>← Geri</button>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.4rem" }}>Odaya Katıl</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", marginBottom: "2rem" }}>4 haneli oda kodunu gir</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[d0, d1, d2, d3].map((ref, i) => (
          <input key={i} ref={ref} type="text" inputMode="numeric" maxLength={1} value={digits[i]}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => { if (e.key === "Backspace" && !digits[i] && i > 0) [d0,d1,d2,d3][i-1].current?.focus(); }}
            onFocus={e => e.currentTarget.select()}
            style={{ width: 60, height: 70, textAlign: "center", fontSize: "2rem", fontWeight: 700, background: "rgba(255,255,255,0.08)", border: `2px solid ${digits[i] ? "#8b5cf6" : "rgba(255,255,255,0.15)"}`, borderRadius: 14, color: "white", outline: "none", transition: "border-color 0.2s" }}
          />
        ))}
      </div>
      {error && <div style={{ color: "#f87171", fontSize: "0.88rem", marginBottom: "1rem" }}>{error}</div>}
      <button onClick={handleJoin} disabled={digits.join("").length < 4 || joining} style={{ ...btnP, opacity: digits.join("").length < 4 || joining ? 0.6 : 1 }}>
        {joining ? "Katılınıyor..." : "Odaya Katıl"}
      </button>
    </div>
  );

  // ════════════════ ROOM ════════════════════════════════════════════════════
  if (screen === "room" && room) {
    return (
      <div className="glass-panel" style={{ padding: "1.5rem", maxWidth: 700, margin: "0 auto", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 220, height: 220, background: "rgba(139,92,246,0.18)", filter: "blur(80px)", borderRadius: "50%", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 220, height: 220, background: "rgba(6,182,212,0.15)", filter: "blur(80px)", borderRadius: "50%", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.2rem" }}>
                {isHost ? "🎙️ Ev sahibi" : "🎧 Dinleyici"} · {room.participants.length} kişi bağlı
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{room.playlist.name}</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <button onClick={copyCode} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", borderRadius: 10, padding: "0.45rem 0.9rem", color: "white", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 }}>
                <span style={{ fontFamily: "monospace", letterSpacing: "0.2em", fontSize: "1.1rem" }}>{room.code}</span>
                {codeCopied
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
              </button>
              <button onClick={handleLeave} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "0.45rem 0.8rem", color: "#f87171", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
                Ayrıl
              </button>
            </div>
          </div>

          {/* Realtime Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.9rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
              Canlı Eşzamanlı Yayın (iOS Safari / Mobile Uyumlu)
            </span>
          </div>

          {/* Now Playing */}
          <div style={{ ...card, marginBottom: "1rem" }}>
            {currentTrack ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "0.9rem" }}>
                  {currentTrack.thumbnail
                    ? <img src={currentTrack.thumbnail} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 52, height: 52, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#ec4899)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                      </div>}
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
                    <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{currentTrack.artist}</div>
                  </div>
                  {audioLoading && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0, animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                </div>

                {/* Progress */}
                <input type="range" min={0} max={duration || 1} step={0.1}
                  value={Math.min(localPos, duration || 1)}
                  onChange={handleSeek}
                  style={{ width: "100%", accentColor: "#8b5cf6", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  <span>{fmt(localPos)}</span>
                  <span>{fmt(duration)}</span>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.2rem", marginTop: "0.75rem" }}>
                  <button onClick={() => room.trackIndex > 0 && handleSelectTrack(room.trackIndex - 1)} disabled={room.trackIndex === 0}
                    style={{ background: "none", border: "none", color: room.trackIndex === 0 ? "rgba(255,255,255,0.2)" : "white", cursor: room.trackIndex === 0 ? "default" : "pointer" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                  </button>
                  <button onClick={handlePlayPause} style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(139,92,246,0.4)", flexShrink: 0 }}>
                    {room.isPlaying
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
                  </button>
                  <button onClick={() => room.trackIndex < tracks.length - 1 && handleSelectTrack(room.trackIndex + 1)} disabled={room.trackIndex >= tracks.length - 1}
                    style={{ background: "none", border: "none", color: room.trackIndex >= tracks.length - 1 ? "rgba(255,255,255,0.2)" : "white", cursor: room.trackIndex >= tracks.length - 1 ? "default" : "pointer" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14 4.96 3.5L8 16.64V9.86zM16 6h2v12h-2z"/></svg>
                  </button>
                </div>
              </>
            ) : (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>Listeden bir şarkı seç</p>
            )}
          </div>

          {/* Track list header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Şarkı Listesi ({tracks.length})</h3>
            <button onClick={() => setShowSearch(s => !s)} style={{ ...btnS, fontSize: "0.82rem", padding: "0.45rem 0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Şarkı Ekle
            </button>
          </div>

          {/* Search panel */}
          {showSearch && (
            <div style={{ ...card, marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="Şarkı ara..." autoFocus style={{ ...inp, flex: 1 }} />
                <button onClick={doSearch} style={{ ...btnS, flexShrink: 0 }}>{searching ? "..." : "Ara"}</button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 240, overflowY: "auto" }}>
                  {searchResults.map(t => (
                    <div key={t.videoId} onClick={() => addTrack(t)} style={{ display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.5rem 0.6rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", cursor: "pointer" }}>
                      {t.thumbnail && <img src={t.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{t.artist}</div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Track list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 320, overflowY: "auto" }}>
            {tracks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>Henüz şarkı yok — "Şarkı Ekle" ile ekle</div>
            ) : tracks.map((t, i) => {
              const isActive = i === room.trackIndex;
              return (
                <div key={t.videoId + i} onClick={() => handleSelectTrack(i)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.75rem", borderRadius: 10, background: isActive ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer" }}>
                  <div style={{ width: 28, textAlign: "center", flexShrink: 0 }}>
                    {isActive && room.isPlaying
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#8b5cf6"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
                      : <span style={{ fontSize: "0.78rem", color: isActive ? "#a78bfa" : "rgba(255,255,255,0.35)" }}>{i + 1}</span>}
                  </div>
                  {t.thumbnail ? <img src={t.thumbnail} alt="" style={{ width: 38, height: 38, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: 7, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{t.artist}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeTrack(i); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "0.2rem", flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
      </div>
    );
  }

  return null;
}