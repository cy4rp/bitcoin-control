import { NextRequest } from "next/server";
import getDb from "@/lib/db";
import { getClientIp } from "@/lib/ip";

export async function POST(request: NextRequest) {
  const { username } = await request.json();
  const ip = getClientIp(request);

  if (!username || typeof username !== "string" || username.trim().length < 1) {
    return Response.json({ error: "ユーザー名が必要です" }, { status: 400 });
  }

  const db = getDb();
  const trimmed = username.trim().slice(0, 30);

  const existing = db
    .prepare("SELECT id, username, points FROM users WHERE username = ?")
    .get(trimmed) as { id: number; username: string; points: number } | undefined;

  if (existing) {
    db.prepare("UPDATE users SET ip_address = ? WHERE id = ?").run(ip, existing.id);
    return Response.json(existing);
  }

  const result = db
    .prepare("INSERT INTO users (username, ip_address) VALUES (?, ?)")
    .run(trimmed, ip);

  return Response.json({
    id: result.lastInsertRowid,
    username: trimmed,
    points: 0,
  });
}
