"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useEffect, useRef, useState, useCallback } from "react";

export default function MusicPlayer() {
  const { currentTrack, isPlaying, play, pause, nextTrack, prevTrack, setIsPlaying, closePlayer, queue } = usePlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 1;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    });
    audio.addEventListener("ended", () => {
      nextTrack();
    });
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch audio URL when track changes
  useEffect(() => {
    if (!currentTrack) {
      setAudioUrl(null);
      setProgress(0);
      setDuration(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setIsLoadingAudio(true);
    setAudioError(null);
    setProgress(0);
    setDuration(0);

    // Try youtube-media API first, fallback to playlist MP3 API
    const fetchAudio = async () => {
      try {
        // Try the RapidAPI MP3 endpoint (same as playlist page uses for download)
        const mp3Res = await fetch(`/api/playlist?videoId=${currentTrack.videoId}`);
        const mp3Data = await mp3Res.json();

        if (mp3Data?.url) {
          setAudioUrl(mp3Data.url);
          isFetchingRef.current = false;
          setIsLoadingAudio(false);
          return;
        }

        // Fallback: try youtube-media API
        const mediaRes = await fetch(`/api/youtube-media/v2/video/details?videoId=${currentTrack.videoId}`);
        const mediaData = await mediaRes.json();
        const audios = mediaData.audios?.items || [];
        const bestAudio = audios.find((a: any) => a.extension === "mp3" || a.extension === "m4a") || audios[0];
        if (bestAudio?.url) {
          setAudioUrl(bestAudio.url);
          isFetchingRef.current = false;
          setIsLoadingAudio(false);
          return;
        }

        setAudioError("Ses kaynağı bulunamadı");
      } catch (e) {
        console.error("Failed to fetch audio url", e);
        setAudioError("Bağlantı hatası");
      } finally {
        isFetchingRef.current = false;
        setIsLoadingAudio(false);
      }
    };

    fetchAudio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.videoId]);

  // When audioUrl changes, load and play
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.src = audioUrl;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Play error:", e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Sync play/pause state
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Play error:", e));
    } else {
      audioRef.current.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Media Session API for notifications
  useEffect(() => {
    if (!currentTrack || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: currentTrack.thumbnail
        ? [{ src: currentTrack.thumbnail, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });

    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Update media session position state
  useEffect(() => {
    if (!("mediaSession" in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: progress,
      });
    } catch {}
  }, [progress, duration]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  }, []);

  const currentIndex = currentTrack ? queue.findIndex(t => t.videoId === currentTrack.videoId) : -1;

  if (!currentTrack) return null;

  const progressPct = duration ? (progress / duration) * 100 : 0;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <>
      <div
        className="player-wrapper"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(8, 8, 18, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 9999,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Track Info */}
        <div className="track-info" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: "52px", height: "52px", borderRadius: "10px", background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)", flexShrink: 0, position: "relative",
            }}
          >
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentTrack.title}
            </div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isLoadingAudio ? (
                <span style={{ color: "#a78bfa" }}>Yükleniyor...</span>
              ) : audioError ? (
                <span style={{ color: "#f87171" }}>{audioError}</span>
              ) : (
                currentTrack.artist
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          className="player-controls"
          style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", padding: "0 1rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            {/* Prev */}
            <button
              onClick={prevTrack}
              disabled={currentIndex <= 0}
              style={{ background: "transparent", border: "none", color: currentIndex <= 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)", cursor: currentIndex <= 0 ? "default" : "pointer", padding: "0.4rem" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => isPlaying ? pause() : play()}
              style={{
                width: "46px", height: "46px", borderRadius: "50%", background: "white", border: "none", color: "black",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                boxShadow: "0 4px 18px rgba(255,255,255,0.25)", flexShrink: 0, transition: "transform 0.1s",
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.92)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isLoadingAudio ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "3px" }}><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              disabled={currentIndex >= queue.length - 1}
              style={{ background: "transparent", border: "none", color: currentIndex >= queue.length - 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)", cursor: currentIndex >= queue.length - 1 ? "default" : "pointer", padding: "0.4rem" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm8.5-6 3.5 6V6z"/></svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", maxWidth: "480px" }}>
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", width: "36px", textAlign: "right", fontFamily: "monospace", flexShrink: 0 }}>
              {fmt(progress)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="player-slider"
              style={{
                flex: 1, height: "4px", WebkitAppearance: "none", appearance: "none",
                background: `linear-gradient(to right, #8b5cf6 ${progressPct}%, rgba(255,255,255,0.12) ${progressPct}%)`,
                borderRadius: "2px", outline: "none", cursor: "pointer",
              }}
            />
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", width: "36px", fontFamily: "monospace", flexShrink: 0 }}>
              {fmt(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume + Close */}
        <div className="volume-control" style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={handleVolume}
            className="player-slider"
            style={{
              width: "72px", height: "4px", WebkitAppearance: "none", appearance: "none",
              background: `linear-gradient(to right, #ec4899 ${volume * 100}%, rgba(255,255,255,0.12) ${volume * 100}%)`,
              borderRadius: "2px", outline: "none", cursor: "pointer",
            }}
          />

          {/* Close Button */}
          <button
            onClick={closePlayer}
            title="Oynatıcıyı Kapat"
            style={{
              width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

          .player-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 13px; width: 13px;
            border-radius: 50%; background: #fff;
            cursor: pointer; opacity: 0;
            transition: opacity 0.2s, transform 0.15s;
          }
          .player-slider:hover::-webkit-slider-thumb { opacity: 1; }
          .player-slider:active::-webkit-slider-thumb { transform: scale(1.25); }

          @media (max-width: 768px) {
            .player-wrapper {
              flex-direction: column !important;
              padding: 0.65rem 0.75rem !important;
              gap: 0.5rem !important;
            }
            .track-info {
              width: 100%;
              flex: none !important;
              justify-content: space-between;
            }
            .player-controls {
              width: 100%;
              flex: none !important;
            }
            .volume-control {
              display: none !important;
            }
            .player-slider::-webkit-slider-thumb {
              opacity: 1 !important;
              width: 14px; height: 14px;
            }
          }
        ` }} />
      </div>
    </>
  );
}
