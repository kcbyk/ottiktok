"use client";

import React, { createContext, useContext, useRef, useState, ReactNode } from "react";

export interface Track {
  videoId: string;
  title: string;
  artist: string;
  thumbnail?: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setQueueAndPlay: (tracks: Track[], startIndex?: number) => void;
  setIsPlaying: (playing: boolean) => void;
  closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlayingState] = useState(false);

  const play = () => setIsPlayingState(true);
  const pause = () => setIsPlayingState(false);

  const setIsPlaying = (playing: boolean) => setIsPlayingState(playing);

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex(t => t.videoId === currentTrack.videoId);
    if (idx >= 0 && idx < queue.length - 1) {
      setCurrentTrack(queue[idx + 1]);
      setIsPlayingState(true);
    }
  };

  const prevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex(t => t.videoId === currentTrack.videoId);
    if (idx > 0) {
      setCurrentTrack(queue[idx - 1]);
      setIsPlayingState(true);
    }
  };

  const setQueueAndPlay = (tracks: Track[], startIndex = 0) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    setCurrentTrack(tracks[startIndex]);
    setIsPlayingState(true);
  };

  const closePlayer = () => {
    setCurrentTrack(null);
    setQueue([]);
    setIsPlayingState(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        play,
        pause,
        nextTrack,
        prevTrack,
        setQueueAndPlay,
        setIsPlaying,
        closePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
