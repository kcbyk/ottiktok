import { createServer } from "node:http";
import { Server } from "socket.io";
import { verifyRealtimeToken } from "../src/lib/realtimeToken";

type TokenPayload = { roomId: string; userId: string; exp: number };
type RoomState = { trackIndex: number; isPlaying: boolean; position: number; updatedAt: number };
const rooms = new Map<string, RoomState>();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.REALTIME_ALLOWED_ORIGIN || true, credentials: true },
});

io.on("connection", (socket) => {
  socket.on("room:join", (token: string, callback?: (state: RoomState) => void) => {
    const payload = verifyRealtimeToken(token);
    if (!payload) return socket.emit("room:error", "Geçersiz veya süresi dolmuş bağlantı");
    socket.data.roomId = payload.roomId;
    socket.data.userId = payload.userId;
    socket.join(payload.roomId);
    const state = rooms.get(payload.roomId) || { trackIndex: 0, isPlaying: false, position: 0, updatedAt: Date.now() };
    rooms.set(payload.roomId, state);
    callback?.(state);
    io.to(payload.roomId).emit("room:presence", io.sockets.adapter.rooms.get(payload.roomId)?.size || 0);
  });

  socket.on("room:update", (update: Partial<RoomState>) => {
    const roomId = socket.data.roomId as string | undefined;
    if (!roomId || (update.trackIndex !== undefined && update.trackIndex < 0) || (update.position !== undefined && update.position < 0)) return;
    const state = { ...(rooms.get(roomId) || { trackIndex: 0, isPlaying: false, position: 0 }), ...update, updatedAt: Date.now() };
    rooms.set(roomId, state);
    socket.to(roomId).emit("room:state", state);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId as string | undefined;
    if (roomId) io.to(roomId).emit("room:presence", io.sockets.adapter.rooms.get(roomId)?.size || 0);
  });
});

const port = Number(process.env.REALTIME_WS_PORT || 3001);
if (process.env.NODE_ENV !== "test") httpServer.listen(port, () => console.log(`Realtime server listening on ${port}`));