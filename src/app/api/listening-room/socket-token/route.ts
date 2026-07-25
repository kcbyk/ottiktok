import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getRoom } from "@/lib/listeningRooms";
import { createRealtimeToken } from "@/lib/realtimeToken";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const roomId = new URL(request.url).searchParams.get("roomId");
  const userId = session?.user?.email;
  if (!userId) return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  const room = roomId ? getRoom(roomId) : null;
  if (!room || !room.participants.includes(userId)) return NextResponse.json({ error: "Odaya erişilemiyor" }, { status: 403 });
  return NextResponse.json({ token: createRealtimeToken(room.id, userId), url: process.env.REALTIME_WS_URL || "http://localhost:3001" });
}