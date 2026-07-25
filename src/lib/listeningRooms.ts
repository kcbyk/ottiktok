import type { Track } from "@/context/PlayerContext";

/**
 * Room state uses NTP-style timing instead of position+timestamp.
 *
 * When PLAYING:
 *   currentPosition(seconds) = (serverNow - startedAt) / 1000
 *   where startedAt is the server-ms when track was at position 0
 *   (adjusted backward on seek: startedAt = serverNow - seekPos*1000)
 *
 * When PAUSED:
 *   currentPosition = pausedAt (seconds)
 */
export interface RoomState {
  code: string;
  hostId: string;
  playlist: { id: string; name: string; tracks: Track[] };
  trackIndex: number;
  isPlaying: boolean;
  startedAt: number;   // server-ms timestamp: "track position was 0 at this server time" (adjusted for seeks)
  pausedAt: number;    // seconds position when paused (irrelevant when isPlaying)
  updatedAt: number;
  participants: string[];
}

const rooms = new Map<string, RoomState>();

function cleanup() {
  const cutoff = Date.now() - 1000 * 60 * 60 * 6;
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
    startedAt: Date.now(), // track position = 0, paused
    pausedAt: 0,
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
  startedAt?: number;  // Computed by client: serverNow - currentPos*1000
  pausedAt?: number;   // Seconds position when pausing
  addTrack?: Track;
  removeTrackIndex?: number;
}

export function updateRoom(code: string, userId: string, update: RoomUpdate): RoomState | null {
  const room = getRoom(code);
  if (!room || !room.participants.includes(userId)) return null;

  if (update.addTrack) {
    if (!room.playlist.tracks.find(t => t.videoId === update.addTrack!.videoId)) {
      room.playlist.tracks.push(update.addTrack);
    }
  }
  if (typeof update.removeTrackIndex === "number") {
    room.playlist.tracks.splice(update.removeTrackIndex, 1);
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
  if (typeof update.startedAt === "number") {
    room.startedAt = update.startedAt;
  }
  if (typeof update.pausedAt === "number") {
    room.pausedAt = update.pausedAt;
  }

  room.updatedAt = Date.now();
  return room;
}

export function leaveRoom(code: string, userId: string): void {
  const room = getRoom(code);
  if (!room) return;
  room.participants = room.participants.filter(p => p !== userId);
  if (room.hostId === userId && room.participants.length > 0) {
    room.hostId = room.participants[0];
  }
  if (room.participants.length === 0) rooms.delete(code);
  else room.updatedAt = Date.now();
}