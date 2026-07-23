"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useEffect, useRef, useState } from "react";

export default function MusicPlayer() {
  const { currentTrack, isPlaying, play, pause, nextTrack, prevTrack, setIsPlaying } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Fetch actual audio URL when track changes
  useEffect(() => {
    if (!currentTrack) {
      setAudioUrl(null);
      return;
    }
    
    let isMounted = true;
    const fetchAudio = async () => {
      setIsLoadingAudio(true);
      try {
        const res = await fetch(`/api/youtube-media/v2/video/details?videoId=${currentTrack.videoId}`);
        const data = await res.json();
        const audios = data.audios?.items || [];
        const bestAudio = audios.find((a: any) => a.extension === "mp3" || a.extension === "m4a") || audios[0];
        if (isMounted && bestAudio?.url) {
          setAudioUrl(bestAudio.url);
        }
      } catch (e) {
        console.error("Failed to fetch audio url", e);
      } finally {
        if (isMounted) setIsLoadingAudio(false);
      }
    };
    
    fetchAudio();
    
    return () => { isMounted = false; };
  }, [currentTrack]);

  // Sync state with audio element
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  if (!currentTrack) return null;

  return (
    <div className="player-wrapper" style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "rgba(10, 10, 20, 0.8)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      padding: "0.75rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 50,
      boxShadow: "0 -10px 40px rgba(0,0,0,0.5)"
    }}>
      <audio
        ref={audioRef}
        src={audioUrl || ""}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay
      />
      
      {/* Track Info */}
      <div className="track-info" style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
        <div style={{ 
          width: "56px", height: "56px", borderRadius: "12px", background: "#222", 
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)", flexShrink: 0
        }}>
          {currentTrack.thumbnail ? (
            <img src={currentTrack.thumbnail} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
          )}
        </div>
        <div style={{ minWidth: 0, paddingRight: "1rem" }}>
          <div style={{ fontWeight: 600, fontSize: "1rem", color: "#fff", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
            {currentTrack.title}
          </div>
          <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {isLoadingAudio ? "Yükleniyor..." : currentTrack.artist}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="player-controls" style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button onClick={prevTrack} className="player-btn" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "0.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5v14l-11-7zM22 5v14l-11-7z"/></svg>
          </button>
          
          <button 
            onClick={() => isPlaying ? pause() : play()} 
            style={{ 
              width: "48px", height: "48px", borderRadius: "50%", background: "white", border: "none", color: "black", 
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              boxShadow: "0 4px 15px rgba(255,255,255,0.2)",
              transition: "transform 0.1s"
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "4px" }}><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          
          <button onClick={nextTrack} className="player-btn" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "0.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13 5v14l11-7zM2 5v14l11-7z"/></svg>
          </button>
        </div>
        
        {/* Progress Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", maxWidth: "500px" }}>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", width: "40px", textAlign: "right", fontFamily: "monospace" }}>
            {Math.floor(progress / 60)}:{(Math.floor(progress % 60)).toString().padStart(2, '0')}
          </span>
          <input 
            type="range" 
            min={0} 
            max={duration || 100} 
            value={progress} 
            onChange={handleSeek}
            className="player-slider"
            style={{
              flex: 1,
              height: "4px",
              WebkitAppearance: "none",
              background: `linear-gradient(to right, #8b5cf6 ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(progress / (duration || 1)) * 100}%)`,
              borderRadius: "2px",
              outline: "none",
              cursor: "pointer"
            }}
          />
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", width: "40px", fontFamily: "monospace" }}>
             {duration ? `${Math.floor(duration / 60)}:${(Math.floor(duration % 60)).toString().padStart(2, '0')}` : "0:00"}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="volume-control" style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        <input 
          type="range" 
          min={0} 
          max={1} 
          step={0.01}
          value={volume} 
          onChange={handleVolume}
          className="player-slider"
          style={{
            width: "80px",
            height: "4px",
            WebkitAppearance: "none",
            background: `linear-gradient(to right, #ec4899 ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
            borderRadius: "2px",
            outline: "none",
            cursor: "pointer"
          }}
        />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .player-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        .player-slider:hover::-webkit-slider-thumb {
          opacity: 1;
        }
        .player-slider:active::-webkit-slider-thumb {
          transform: scale(1.2);
        }
        .player-btn {
          transition: color 0.2s;
        }
        .player-btn:hover {
          color: white !important;
        }
        
        @media (max-width: 768px) {
          .player-wrapper {
            flex-direction: column;
            padding: 0.75rem !important;
            gap: 0.5rem;
          }
          .track-info {
            width: 100%;
            flex: none !important;
          }
          .player-controls {
            width: 100%;
            flex: none !important;
          }
          .volume-control {
            display: none !important;
          }
          .player-slider::-webkit-slider-thumb {
             opacity: 1;
             width: 10px;
             height: 10px;
          }
        }
      `}} />
    </div>
  );
}
