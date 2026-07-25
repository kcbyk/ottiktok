import { createHmac, timingSafeEqual } from "node:crypto";

type TokenPayload = { roomId: string; userId: string; exp: number };

export function createRealtimeToken(roomId: string, userId: string) {
  const payload = Buffer.from(JSON.stringify({
    roomId,
    userId,
    exp: Date.now() + 1000 * 60 * 10,
  } satisfies TokenPayload)).toString("base64url");
  const signature = createHmac("sha256", process.env.NEXTAUTH_SECRET || "development-secret")
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyRealtimeToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", process.env.NEXTAUTH_SECRET || "development-secret")
    .update(payload)
    .digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const result = JSON.parse(Buffer.from(payload, "base64url").toString()) as TokenPayload;
  return result.exp > Date.now() ? result : null;
}