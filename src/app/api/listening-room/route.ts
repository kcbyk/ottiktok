import { NextRequest, NextResponse } from "next/server";
import { createRoom, joinRoom, leaveRoom, updateRoom } from "@/lib/listeningRooms";

// No auth required – user identity comes from a client-generated anonymous userId
// sent as the X-Savio-User header (a random uuid stored in localStorage on the client).

function getUserId(request: NextRequest) {
  return request.headers.get("x-savio-user") || "anonymous";
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  const body = await request.json();

  // Join existing room
  if (body.roomId) {
    const room = joinRoom(body.roomId, userId);
    return room
      ? NextResponse.json(room)
      : NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
  }

  // Create new room
  if (!body.playlist?.name || !Array.isArray(body.playlist.tracks)) {
    return NextResponse.json({ error: "Geçerli bir playlist gerekli" }, { status: 400 });
  }

  const playlist = {
    id: body.playlist.id || Date.now().toString(),
    name: body.playlist.name,
    tracks: body.playlist.tracks,
  };
  return NextResponse.json(createRoom(userId, playlist));
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  const id = new URL(request.url).searchParams.get("roomId");
  const room = id ? joinRoom(id, userId) : null;
  return room
    ? NextResponse.json(room)
    : NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
}

export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  const body = await request.json();
  const room = updateRoom(body.roomId, userId, body.update);
  return room
    ? NextResponse.json(room)
    : NextResponse.json({ error: "Odaya erişilemiyor" }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  leaveRoom(new URL(request.url).searchParams.get("roomId") || "", userId);
  return NextResponse.json({ ok: true });
}