"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { ListeningRoomState } from "@/lib/listeningRooms";
import { io, Socket } from "socket.io-client";

// Anonymous user ID – persisted in localStorage so the same device keeps its identity
function getAnonymousUserId(): string {
  if (typeof window === "undefined") return "ssr-user";
  let id = localStorage.getItem("savio_user_id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem("savio_user_id", id);
  }
  return id;
}

function roomFetch(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-savio-user": getAnonymousUserId(), ...(opts.headers || {}) },
  });
}

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
  listeningRoomId: string | null;
  listeningRoomParticipants: number;
  joinListeningRoom: (roomId: string) => Promise<void>;
  createListeningRoom: (playlist: { id: string; name: string; tracks: Track[] }) => Promise<string>;
  leaveListeningRoom: () => void;
  syncListeningPosition: (position: number) => void;
  listeningRoomConnection: "connecting" | "connected" | "polling" | "disconnected";
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listeningRoomId, setListeningRoomId] = useState<string | null>(null);
  const [listeningRoomParticipants, setListeningRoomParticipants] = useState(0);
  const applyingRemote = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const [listeningRoomConnection, setListeningRoomConnection] = useState<"connecting" | "connected" | "polling" | "disconnected">("disconnected");

  const applyRoom = (room: ListeningRoomState) => {
    applyingRemote.current = true;
    setQueue(room.playlist.tracks);
    setCurrentTrack(room.playlist.tracks[room.trackIndex] || null);
    setIsPlaying(room.isPlaying);
    setListeningRoomParticipants(room.participants.length);
    window.dispatchEvent(new CustomEvent("listening-room-position", { detail: room.position }));
    window.setTimeout(() => { applyingRemote.current = false; }, 0);
  };

  const sendRoomUpdate = async (update: Record<string, unknown>) => {
    if (!listeningRoomId || applyingRemote.current) return;
    if (socketRef.current?.connected) {
      socketRef.current.emit("room:update", update);
      return;
    }
    await roomFetch("/api/listening-room", { method: "PATCH", body: JSON.stringify({ roomId: listeningRoomId, update }) });
  };

  useEffect(() => {
    if (!listeningRoomId) return;
    let timer: number | undefined;
    const connect = async () => {
      setListeningRoomConnection("connecting");
      const tokenResponse = await fetch(`/api/listening-room/socket-token?roomId=${encodeURIComponent(listeningRoomId)}`);
      if (!tokenResponse.ok) throw new Error("Socket token alınamadı");
      const { token, url } = await tokenResponse.json();
      const socket = io(url, { transports: ["websocket"], reconnection: true });
      socketRef.current = socket;
      socket.on("connect", () => {
        setListeningRoomConnection("connected");
        socket.emit("room:join", token);
      });
      socket.on("room:state", (state: { trackIndex: number; isPlaying: boolean; position: number }) => {
        const track = queue[state.trackIndex];
        if (!track) return;
        applyRoom({ id: listeningRoomId, playlist: { id: "", name: "", tracks: queue }, ...state, updatedAt: Date.now(), participants: [] });
      });
      socket.on("room:presence", setListeningRoomParticipants);
      socket.on("disconnect", () => setListeningRoomConnection("polling"));
      socket.on("connect_error", () => setListeningRoomConnection("polling"));
    };
    void connect().catch(() => setListeningRoomConnection("polling"));
    const poll = async () => {
      if (socketRef.current?.connected) return;
      const response = await roomFetch(`/api/listening-room?roomId=${encodeURIComponent(listeningRoomId)}`);
      if (response.ok) applyRoom(await response.json());
    };
    poll();
    timer = window.setInterval(poll, 1000);
    return () => {
      if (timer) window.clearInterval(timer);
      socketRef.current?.disconnect();
      socketRef.current = null;
      setListeningRoomConnection("disconnected");
    };
  }, [listeningRoomId]);

  const play = () => { setIsPlaying(true); void sendRoomUpdate({ isPlaying: true }); };
  const pause = () => { setIsPlaying(false); void sendRoomUpdate({ isPlaying: false }); };

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.videoId === currentTrack.videoId);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1]);
      setIsPlaying(true);
      void sendRoomUpdate({ trackIndex: currentIndex + 1, position: 0, isPlaying: true });
    }
  };

  const prevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.videoId === currentTrack.videoId);
    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1]);
      setIsPlaying(true);
      void sendRoomUpdate({ trackIndex: currentIndex - 1, position: 0, isPlaying: true });
    }
  };

  const setQueueAndPlay = (tracks: Track[], startIndex: number = 0) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    setCurrentTrack(tracks[startIndex]);
    setIsPlaying(true);
    void sendRoomUpdate({ trackIndex: startIndex, position: 0, isPlaying: true });
  };

  const createListeningRoom = async (playlist: { id: string; name: string; tracks: Track[] }) => {
    const response = await roomFetch("/api/listening-room", { method: "POST", body: JSON.stringify({ playlist }) });
    if (!response.ok) throw new Error((await response.json()).error || "Oda oluşturulamadı");
    const room = await response.json();
    setListeningRoomId(room.id);
    applyRoom(room);
    return room.id;
  };

  const joinListeningRoom = async (roomId: string) => {
    const response = await roomFetch("/api/listening-room", { method: "POST", body: JSON.stringify({ roomId }) });
    if (!response.ok) throw new Error((await response.json()).error || "Odaya katılınamadı");
    const room = await response.json();
    setListeningRoomId(room.id);
    applyRoom(room);
  };

  const leaveListeningRoom = () => {
    if (listeningRoomId) void roomFetch(`/api/listening-room?roomId=${listeningRoomId}`, { method: "DELETE" });
    setListeningRoomId(null);
  };

  const syncListeningPosition = (position: number) => {
    void sendRoomUpdate({ position });
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
        listeningRoomId,
        listeningRoomParticipants,
        joinListeningRoom,
        createListeningRoom,
        leaveListeningRoom,
        syncListeningPosition,
        listeningRoomConnection,
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
