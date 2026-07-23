"use client";

import { useState, useEffect } from "react";
import { Track } from "@/context/PlayerContext";

export interface SavedPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: number;
}

export function useLibrary() {
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("savio_library");
    if (saved) {
      try {
        setPlaylists(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing library", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const savePlaylist = (name: string, description: string, tracks: Track[]) => {
    const newPlaylist: SavedPlaylist = {
      id: Date.now().toString(),
      name,
      description,
      tracks,
      createdAt: Date.now(),
    };
    
    const updated = [newPlaylist, ...playlists];
    setPlaylists(updated);
    localStorage.setItem("savio_library", JSON.stringify(updated));
    return newPlaylist;
  };

  const deletePlaylist = (id: string) => {
    const updated = playlists.filter(p => p.id !== id);
    setPlaylists(updated);
    localStorage.setItem("savio_library", JSON.stringify(updated));
  };

  return { playlists, isLoaded, savePlaylist, deletePlaylist };
}
