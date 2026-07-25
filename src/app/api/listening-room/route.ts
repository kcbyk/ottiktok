import { NextRequest, NextResponse } from "next/server";
import { createRoom, joinRoom, leaveRoom, updateRoom } from "@/lib/listeningRooms";

function uid(req: NextRequest) {
  return req.headers.get("x-savio-user") || "anonymous";
}

export async function POST(req: NextRequest) {
  const userId = uid(req);
  const body = await req.json();

  // JOIN existing room by 4-digit code
  if (body.action === "join") {
    const code = String(body.code ?? "").trim();
    if (!code) return NextResponse.json({ error: "Kod gerekli" }, { status: 400 });
    const room = joinRoom(code, userId);
    return room
      ? NextResponse.json(room)
      : NextResponse.json({ error: "Oda bulunamadı. Kodu kontrol edin." }, { status: 404 });
  }

  // CREATE new room
  if (body.action === "create") {
    if (!body.playlist?.name || !Array.isArray(body.playlist.tracks)) {
      return NextResponse.json({ error: "Geçerli playlist gerekli" }, { status: 400 });
    }
    const playlist = {
      id: body.playlist.id ?? Date.now().toString(),
      name: body.playlist.name,
      tracks: body.playlist.tracks,
    };
    return NextResponse.json(createRoom(userId, playlist));
  }

  return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
}

// Poll for current room state
export async function GET(req: NextRequest) {
  const userId = uid(req);
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (!code) return NextResponse.json({ error: "Kod gerekli" }, { status: 400 });
  const room = joinRoom(code, userId); // joinRoom is idempotent
  return room
    ? NextResponse.json(room)
    : NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
}

// Update room (any participant can update track/play state; all can add songs)
export async function PATCH(req: NextRequest) {
  const userId = uid(req);
  const body = await req.json();
  const code = String(body.code ?? "").trim();
  const room = updateRoom(code, userId, body.update ?? {});
  return room
    ? NextResponse.json(room)
    : NextResponse.json({ error: "Odaya erişilemiyor" }, { status: 404 });
}

// Leave room
export async function DELETE(req: NextRequest) {
  const userId = uid(req);
  const code = new URL(req.url).searchParams.get("code") ?? "";
  leaveRoom(code, userId);
  return NextResponse.json({ ok: true });
}