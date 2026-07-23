"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

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
  const [isPlaying, setIsPlaying] = useState(false);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.videoId === currentTrack.videoId);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const prevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.videoId === currentTrack.videoId);
    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  const setQueueAndPlay = (tracks: Track[], startIndex: number = 0) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    setCurrentTrack(tracks[startIndex]);
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setCurrentTrack(null);
    setQueue([]);
    setIsPlaying(false);
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
