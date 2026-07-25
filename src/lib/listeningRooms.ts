import type { Track } from "@/context/PlayerContext";

export interface RoomState {
  code: string;          // 4-digit code, e.g. "4827"
  hostId: string;
  playlist: { id: string; name: string; tracks: Track[] };
  trackIndex: number;
  isPlaying: boolean;
  position: number;
  positionSavedAt: number; // ms timestamp – used to estimate actual position on clients
  updatedAt: number;
  participants: string[];
}

const rooms = new Map<string, RoomState>();

function cleanup() {
  const cutoff = Date.now() - 1000 * 60 * 60 * 6; // 6 hours
  for (const [code, room] of rooms) {
    if (room.updatedAt < cutoff) rooms.delete(code);
  }
}

function generateCode(): string {
  cleanup();
  let code: string;
  let attempts = 0;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
    attempts++;
  } while (rooms.has(code) && attempts < 100);
  return code;
}

export function createRoom(userId: string, playlist: RoomState["playlist"]): RoomState {
  const code = generateCode();
  const room: RoomState = {
    code,
    hostId: userId,
    playlist,
    trackIndex: 0,
    isPlaying: false,
    position: 0,
    positionSavedAt: Date.now(),
    updatedAt: Date.now(),
    participants: [userId],
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code);
}

export function joinRoom(code: string, userId: string): RoomState | null {
  const room = getRoom(code);
  if (!room) return null;
  if (!room.participants.includes(userId)) room.participants.push(userId);
  room.updatedAt = Date.now();
  return room;
}

export interface RoomUpdate {
  trackIndex?: number;
  isPlaying?: boolean;
  position?: number;        // if provided, also updates positionSavedAt
  addTrack?: Track;
  removeTrackIndex?: number;
}

export function updateRoom(code: string, userId: string, update: RoomUpdate): RoomState | null {
  const room = getRoom(code);
  if (!room || !room.participants.includes(userId)) return null;

  if (update.addTrack) {
    // Prevent duplicate videoIds
    if (!room.playlist.tracks.find(t => t.videoId === update.addTrack!.videoId)) {
      room.playlist.tracks.push(update.addTrack);
    }
  }
  if (typeof update.removeTrackIndex === "number") {
    room.playlist.tracks.splice(update.removeTrackIndex, 1);
    // Adjust trackIndex if needed
    if (room.trackIndex >= room.playlist.tracks.length) {
      room.trackIndex = Math.max(0, room.playlist.tracks.length - 1);
    }
  }
  if (typeof update.trackIndex === "number") {
    room.trackIndex = update.trackIndex;
  }
  if (typeof update.isPlaying === "boolean") {
    room.isPlaying = update.isPlaying;
  }
  if (typeof update.position === "number") {
    room.position = update.position;
    room.positionSavedAt = Date.now();
  }

  room.updatedAt = Date.now();
  return room;
}

export function leaveRoom(code: string, userId: string): void {
  const room = getRoom(code);
  if (!room) return;
  room.participants = room.participants.filter(p => p !== userId);
  // Transfer host to next participant if host left
  if (room.hostId === userId && room.participants.length > 0) {
    room.hostId = room.participants[0];
  }
  if (room.participants.length === 0) rooms.delete(code);
  else room.updatedAt = Date.now();
}