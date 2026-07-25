"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLibrary } from "@/hooks/useLibrary";
import type { Track } from "@/context/PlayerContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (!isFinite(s) || isNaN(s)) return "0:00";
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
  position: number;
  positionSavedAt: number;
  updatedAt: number;
  participants: string[];
}

type Screen = "home" | "create" | "join" | "room";

const SYNC_THRESHOLD = 5; // seconds – only seek if drift > this

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListeningRoomPage() {
  const { playlists, isLoaded } = useLibrary();
  const userId = getUID();

  // ── Navigation
  const [screen, setScreen] = useState<Screen>("home");
  const [error, setError] = useState("");

  // ── Create flow
  const [selectedPl, setSelectedPl] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Join flow (4 digit boxes)
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [joining, setJoining] = useState(false);
  const d0 = useRef<HTMLInputElement>(null);
  const d1 = useRef<HTMLInputElement>(null);
  const d2 = useRef<HTMLInputElement>(null);
  const d3 = useRef<HTMLInputElement>(null);
  const digitRefs = [d0, d1, d2, d3];

  // ── Room state
  const [room, setRoom] = useState<RoomState | null>(null);
  const roomRef = useRef<RoomState | null>(null);
  useEffect(() => { roomRef.current = room; }, [room]);

  // ── Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadingVidRef = useRef(""); // videoId currently being fetched
  const [audioLoading, setAudioLoading] = useState(false);
  const [localPos, setLocalPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);

  // ── Song search (add to room)
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);

  // ── Copied code feedback
  const [codeCopied, setCodeCopied] = useState(false);

  const isHost = room?.hostId === userId;
  const tracks = room?.playlist.tracks ?? [];
  const currentTrack = tracks[room?.trackIndex ?? -1] ?? null;

  // ─────────────────────────────────────────────────────────────────────────
  // Audio setup (once on mount)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";

    audio.addEventListener("timeupdate", () => setLocalPos(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(isFinite(audio.duration) ? audio.duration : 0));
    audio.addEventListener("playing", () => setLocalPlaying(true));
    audio.addEventListener("pause", () => setLocalPlaying(false));

    // Auto advance when track ends (anyone in room can do this, but only send if host)
    audio.addEventListener("ended", () => {
      const r = roomRef.current;
      if (!r) return;
      const amHost = r.hostId === getUID();
      if (!amHost) return;
      const nextIdx = r.trackIndex + 1;
      if (nextIdx < r.playlist.tracks.length) {
        void doUpdate({ trackIndex: nextIdx, position: 0, isPlaying: true }, r.code);
      } else {
        void doUpdate({ isPlaying: false, position: 0 }, r.code);
      }
    });

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Polling
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!room?.code) return;
    const code = room.code;

    const poll = async () => {
      try {
        const res = await rfetch(`/api/listening-room?code=${code}`);
        if (res.ok) applyRoom(await res.json());
      } catch { /* ignore network errors */ }
    };

    poll(); // immediate
    const timer = setInterval(poll, 2500);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.code]);

  // ─────────────────────────────────────────────────────────────────────────
  // Apply room state from server
  // ─────────────────────────────────────────────────────────────────────────
  const applyRoom = useCallback((r: RoomState) => {
    setRoom(r);
    const audio = audioRef.current;
    if (!audio) return;

    const track = r.playlist.tracks[r.trackIndex];
    if (!track) return;

    // Estimate server-side current position accounting for elapsed time
    const elapsedSecs = r.isPlaying ? (Date.now() - r.positionSavedAt) / 1000 : 0;
    const estPos = Math.max(0, r.position + elapsedSecs);

    if (track.videoId !== loadingVidRef.current) {
      // Different track – load it
      void loadAudio(track, estPos, r.isPlaying);
    } else {
      // Same track – only sync position if drift is large
      const delta = Math.abs(audio.currentTime - estPos);
      if (delta > SYNC_THRESHOLD) {
        audio.currentTime = estPos;
      }
      // Sync play/pause state
      if (r.isPlaying && audio.paused) {
        audio.play().catch(() => {});
      } else if (!r.isPlaying && !audio.paused) {
        audio.pause();
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Load audio URL for a track
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

      // Try primary endpoint
      const r1 = await fetch(`/api/playlist?videoId=${track.videoId}`);
      if (r1.ok) {
        const d1 = await r1.json();
        url = d1.audioUrl || d1.url || "";
      }

      // Fallback
      if (!url) {
        const r2 = await fetch(`/api/youtube-media/stream?videoId=${track.videoId}`);
        if (r2.ok) {
          const d2 = await r2.json();
          url = d2.url || d2.audioUrl || "";
        }
      }

      if (!url) throw new Error("Ses URL alınamadı");

      audio.src = url;
      audio.load();

      await new Promise<void>((resolve, reject) => {
        const ok = () => { cleanup(); resolve(); };
        const err = () => { cleanup(); reject(new Error("load error")); };
        const cleanup = () => {
          audio.removeEventListener("canplay", ok);
          audio.removeEventListener("error", err);
        };
        audio.addEventListener("canplay", ok, { once: true });
        audio.addEventListener("error", err, { once: true });
      });

      audio.currentTime = seekTo;
      if (autoplay) await audio.play();
    } catch (e) {
      console.error("loadAudio error", e);
    } finally {
      setAudioLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Send update to server
  // ─────────────────────────────────────────────────────────────────────────
  const doUpdate = async (update: Record<string, unknown>, overrideCode?: string) => {
    const code = overrideCode ?? room?.code;
    if (!code) return;
    try {
      const res = await rfetch("/api/listening-room", {
        method: "PATCH",
        body: JSON.stringify({ code, update }),
      });
      if (res.ok) {
        const updated: RoomState = await res.json();
        setRoom(updated);
      }
    } catch { /* ignore */ }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Create room
  // ─────────────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const pl = playlists.find(p => p.id === selectedPl);
    if (!pl) return setError("Playlist seçin.");
    setCreating(true); setError("");
    try {
      const res = await rfetch("/api/listening-room", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          playlist: { id: pl.id, name: pl.name, tracks: pl.tracks },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Hata");
      const r: RoomState = await res.json();
      setRoom(r);
      setScreen("room");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    } finally { setCreating(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Join room
  // ─────────────────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    const code = digits.join("");
    if (code.length < 4) return setError("4 haneli kodu girin.");
    setJoining(true); setError("");
    try {
      const res = await rfetch("/api/listening-room", {
        method: "POST",
        body: JSON.stringify({ action: "join", code }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Oda bulunamadı");
      const r: RoomState = await res.json();
      setRoom(r);
      setScreen("room");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oda bulunamadı");
    } finally { setJoining(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Digit input for join code
  // ─────────────────────────────────────────────────────────────────────────
  const handleDigit = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 3) digitRefs[i + 1].current?.focus();
    if (!v && i > 0) digitRefs[i - 1].current?.focus();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Playback controls
  // ─────────────────────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !room) return;
    const newPlaying = !room.isPlaying;
    void doUpdate({ isPlaying: newPlaying, position: audio.currentTime });
  };

  const handleSelectTrack = (index: number) => {
    if (!room) return;
    void doUpdate({ trackIndex: index, position: 0, isPlaying: true });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !room) return;
    const pos = Number(e.target.value);
    audio.currentTime = pos;
    void doUpdate({ position: pos });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Song search & add
  // ─────────────────────────────────────────────────────────────────────────
  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(searchQ)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  };

  const addTrackToRoom = (track: Track) => {
    void doUpdate({ addTrack: track });
    setShowSearch(false);
    setSearchQ("");
    setSearchResults([]);
  };

  const removeTrackFromRoom = (index: number) => {
    void doUpdate({ removeTrackIndex: index });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Leave room
  // ─────────────────────────────────────────────────────────────────────────
  const handleLeave = async () => {
    if (room) {
      await rfetch(`/api/listening-room?code=${room.code}`, { method: "DELETE" });
    }
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = "";
    loadingVidRef.current = "";
    setRoom(null);
    setLocalPos(0);
    setDuration(0);
    setLocalPlaying(false);
    setScreen("home");
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Shared styles
  // ─────────────────────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "14px",
    padding: "1.25rem",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.8rem 1rem",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    color: "white",
    outline: "none",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "0.85rem",
    background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
  };
  const btnSecondary: React.CSSProperties = {
    padding: "0.6rem 1.1rem",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "10px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  };

  if (!isLoaded) return (
    <div className="glass-panel" style={{ padding: "2rem", textAlign: "center" }}>
      Yükleniyor...
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // HOME SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (screen === "home") return (
    <div className="glass-panel" style={{ padding: "2.5rem 2rem", maxWidth: "500px", margin: "0 auto", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, background: "rgba(6,182,212,0.2)", filter: "blur(70px)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 180, height: 180, background: "rgba(139,92,246,0.2)", filter: "blur(70px)", borderRadius: "50%", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Link href="/music" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.85rem" }}>← Kütüphaneye Dön</Link>

        <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "1.5rem auto 1rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10" opacity="0.25"/><circle cx="12" cy="12" r="6" opacity="0.5"/><circle cx="12" cy="12" r="3"/></svg>
        </div>

        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Birlikte Dinle</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.92rem", marginBottom: "2.5rem", lineHeight: 1.6 }}>
          Oda oluştur ve 4 haneli kodu arkadaşlarınla paylaş — aynı anda senkronize dinleyin.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <button
            onClick={() => { setScreen("create"); setError(""); }}
            style={{ ...btnPrimary, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Oda Oluştur
          </button>
          <button
            onClick={() => { setScreen("join"); setError(""); setDigits(["","","",""]); }}
            style={{ ...btnPrimary, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Odaya Katıl
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // CREATE SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (screen === "create") return (
    <div className="glass-panel" style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.5rem", padding: 0 }}>
        ← Geri
      </button>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.4rem" }}>Oda Oluştur</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Kütüphanendeki bir playlistle oda kur. Oda kodu oluşturulur.
      </p>

      {playlists.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1.5rem", ...cardStyle }}>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>Kütüphanende playlist yok.</p>
          <Link href="/music" style={{ ...btnSecondary, textDecoration: "none", display: "inline-block" }}>Playlist Oluştur</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.5rem" }}>Playlist Seç</label>
            <select value={selectedPl} onChange={e => setSelectedPl(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
              <option value="" style={{ background: "#111" }}>— Playlist seçin —</option>
              {playlists.map(p => (
                <option key={p.id} value={p.id} style={{ background: "#111" }}>{p.name} · {p.tracks.length} şarkı</option>
              ))}
            </select>
          </div>
          {error && <div style={{ color: "#f87171", fontSize: "0.88rem" }}>{error}</div>}
          <button
            onClick={handleCreate}
            disabled={!selectedPl || creating}
            style={{ ...btnPrimary, opacity: !selectedPl || creating ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            {creating ? "Oda oluşturuluyor..." : "Oda Oluştur →"}
          </button>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // JOIN SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (screen === "join") return (
    <div className="glass-panel" style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.5rem", padding: 0 }}>
        ← Geri
      </button>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.4rem" }}>Odaya Katıl</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", marginBottom: "2rem" }}>4 haneli oda kodunu gir</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[d0, d1, d2, d3].map((ref, i) => (
          <input
            key={i}
            ref={ref}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => { if (e.key === "Backspace" && !digits[i] && i > 0) digitRefs[i-1].current?.focus(); }}
            onFocus={e => e.currentTarget.select()}
            style={{
              width: "60px", height: "70px",
              textAlign: "center",
              fontSize: "2rem", fontWeight: 700,
              background: "rgba(255,255,255,0.08)",
              border: `2px solid ${digits[i] ? "#8b5cf6" : "rgba(255,255,255,0.15)"}`,
              borderRadius: "14px", color: "white", outline: "none",
              transition: "border-color 0.2s",
            }}
          />
        ))}
      </div>

      {error && <div style={{ color: "#f87171", fontSize: "0.88rem", marginBottom: "1rem" }}>{error}</div>}

      <button
        onClick={handleJoin}
        disabled={digits.join("").length < 4 || joining}
        style={{ ...btnPrimary, opacity: digits.join("").length < 4 || joining ? 0.6 : 1 }}
      >
        {joining ? "Katılınıyor..." : "Odaya Katıl"}
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // ROOM SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (screen === "room" && room) {
    const progressPct = duration > 0 ? (localPos / duration) * 100 : 0;

    return (
      <div className="glass-panel" style={{ padding: "1.5rem", maxWidth: "700px", margin: "0 auto", position: "relative", overflow: "hidden" }}>
        {/* Bg glow */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 220, height: 220, background: "rgba(139,92,246,0.18)", filter: "blur(80px)", borderRadius: "50%", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 220, height: 220, background: "rgba(6,182,212,0.15)", filter: "blur(80px)", borderRadius: "50%", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1 }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.2rem" }}>
                {isHost ? "🎙️ Sen ev sahibisin" : "🎧 Dinleyici"} · {room.participants.length} kişi bağlı
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{room.playlist.name}</h2>
            </div>

            {/* Room code badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <button
                onClick={copyCode}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", borderRadius: "10px", padding: "0.45rem 0.9rem", color: "white", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 }}
                title="Kodu kopyala"
              >
                <span style={{ fontFamily: "monospace", letterSpacing: "0.2em", fontSize: "1.1rem" }}>{room.code}</span>
                {codeCopied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
              </button>
              <button
                onClick={handleLeave}
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "0.45rem 0.8rem", color: "#f87171", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
              >
                Ayrıl
              </button>
            </div>
          </div>

          {/* ── Now Playing ── */}
          <div style={{ ...cardStyle, marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {currentTrack ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                  {currentTrack.thumbnail ? (
                    <img src={currentTrack.thumbnail} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#ec4899)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    </div>
                  )}
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
                    <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{currentTrack.artist}</div>
                  </div>
                  {audioLoading && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0, animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    value={localPos}
                    onChange={handleSeek}
                    style={{ width: "100%", accentColor: "#8b5cf6", cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                    <span>{fmt(localPos)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.2rem" }}>
                  {/* Prev */}
                  <button
                    onClick={() => room.trackIndex > 0 && handleSelectTrack(room.trackIndex - 1)}
                    disabled={room.trackIndex === 0}
                    style={{ background: "none", border: "none", color: room.trackIndex === 0 ? "rgba(255,255,255,0.2)" : "white", cursor: room.trackIndex === 0 ? "default" : "pointer", padding: "0.3rem" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={handlePlayPause}
                    style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(139,92,246,0.4)", flexShrink: 0 }}
                  >
                    {room.isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>

                  {/* Next */}
                  <button
                    onClick={() => room.trackIndex < tracks.length - 1 && handleSelectTrack(room.trackIndex + 1)}
                    disabled={room.trackIndex >= tracks.length - 1}
                    style={{ background: "none", border: "none", color: room.trackIndex >= tracks.length - 1 ? "rgba(255,255,255,0.2)" : "white", cursor: room.trackIndex >= tracks.length - 1 ? "default" : "pointer", padding: "0.3rem" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14 4.96 3.5L8 16.64V9.86zM16 6h2v12h-2z"/></svg>
                  </button>
                </div>
              </>
            ) : (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", padding: "0.5rem 0" }}>
                Listeden bir şarkı seç
              </p>
            )}
          </div>

          {/* ── Playlist / Track List ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Şarkı Listesi ({tracks.length})</h3>
            <button
              onClick={() => setShowSearch(s => !s)}
              style={{ ...btnSecondary, fontSize: "0.82rem", padding: "0.45rem 0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Şarkı Ekle
            </button>
          </div>

          {/* Search panel */}
          {showSearch && (
            <div style={{ ...cardStyle, marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="Şarkı ara..."
                  autoFocus
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={doSearch} style={{ ...btnSecondary, flexShrink: 0 }}>
                  {searching ? "..." : "Ara"}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "240px", overflowY: "auto" }}>
                  {searchResults.map(t => (
                    <div key={t.videoId} style={{ display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.5rem 0.6rem", borderRadius: "8px", background: "rgba(255,255,255,0.04)", cursor: "pointer" }}
                      onClick={() => addTrackToRoom(t)}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "320px", overflowY: "auto" }}>
            {tracks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>
                Henüz şarkı yok — "Şarkı Ekle" butonu ile ekle
              </div>
            ) : tracks.map((t, i) => {
              const isActive = i === room.trackIndex;
              return (
                <div
                  key={t.videoId + i}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.65rem 0.75rem", borderRadius: "10px",
                    background: isActive ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.07)"}`,
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onClick={() => handleSelectTrack(i)}
                >
                  <div style={{ width: 28, flexShrink: 0, textAlign: "center" }}>
                    {isActive && room.isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#8b5cf6"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
                    ) : (
                      <span style={{ fontSize: "0.78rem", color: isActive ? "#a78bfa" : "rgba(255,255,255,0.35)" }}>{i + 1}</span>
                    )}
                  </div>
                  {t.thumbnail ? (
                    <img src={t.thumbnail} alt="" style={{ width: 38, height: 38, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: 7, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: isActive ? 700 : 500, color: isActive ? "white" : "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{t.artist}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removeTrackFromRoom(i); }}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "0.2rem", flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                    title="Kaldır"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  return null;
}