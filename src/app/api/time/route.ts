import { NextResponse } from "next/server";

// Ultra-lightweight endpoint – just returns server wall-clock time.
// Clients use this to measure their clock offset against the server
// via a simple NTP-style protocol.
export async function GET() {
  return NextResponse.json({ t: Date.now() });
}
