import { randomBytes } from "crypto";
import type { Track } from "@/context/PlayerContext";

export interface ListeningRoomState {
  id: string;
  playlist: { id: string; name: string; tracks: Track[] };
  trackIndex: number;
  isPlaying: boolean;
  position: number;
  updatedAt: number;
  participants: string[];
}

const rooms = new Map<string, ListeningRoomState>();

function cleanup() {
  const cutoff = Date.now() - 1000 * 60 * 60 * 12;
  for (const [id, room] of rooms) if (room.updatedAt < cutoff) rooms.delete(id);
}

export function createRoom(userId: string, playlist: ListeningRoomState["playlist"]) {
  cleanup();
  const id = randomBytes(9).toString("base64url");
  const room: ListeningRoomState = {
    id,
    playlist,
    trackIndex: 0,
    isPlaying: false,
    position: 0,
    updatedAt: Date.now(),
    participants: [userId],
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string) {
  cleanup();
  return rooms.get(id);
}

export function joinRoom(id: string, userId: string) {
  const room = getRoom(id);
  if (!room) return null;
  if (!room.participants.includes(userId)) room.participants.push(userId);
  room.updatedAt = Date.now();
  return room;
}

export function updateRoom(id: string, userId: string, update: Partial<Pick<ListeningRoomState, "trackIndex" | "isPlaying" | "position">>) {
  const room = getRoom(id);
  if (!room || !room.participants.includes(userId)) return null;
  Object.assign(room, update, { updatedAt: Date.now() });
  return room;
}

export function leaveRoom(id: string, userId: string) {
  const room = getRoom(id);
  if (!room) return;
  room.participants = room.participants.filter((participant) => participant !== userId);
  if (room.participants.length === 0) rooms.delete(id);
}