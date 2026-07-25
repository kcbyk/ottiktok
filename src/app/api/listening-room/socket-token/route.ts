import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/lib/listeningRooms";
import { createRealtimeToken } from "@/lib/realtimeToken";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? url.searchParams.get("roomId") ?? "";
  const userId = request.headers.get("x-savio-user") ?? "anonymous";

  const room = code ? getRoom(code) : null;
  if (!room || !room.participants.includes(userId)) {
    return NextResponse.json({ error: "Odaya erişilemiyor" }, { status: 403 });
  }

  return NextResponse.json({
    token: createRealtimeToken(room.code, userId),
    url: process.env.REALTIME_WS_URL ?? "http://localhost:3001",
  });
}