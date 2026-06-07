import { NextRequest } from "next/server";
import getDb from "@/lib/db";

export async function POST(request: NextRequest) {
  const { username } = await request.json();
  if (!username || typeof username !== "string" || username.trim().length < 1) {
    return Response.json({ error: "ユーザー名が必要です" }, { status: 400 });
  }

  const db = getDb();
  const trimmed = username.trim().slice(0, 30);

  const existing = db
    .prepare("SELECT id, username, points FROM users WHERE username = ?")
    .get(trimmed) as { id: number; username: string; points: number } | undefined;

  if (existing) {
    return Response.json(existing);
  }

  const result = db
    .prepare("INSERT INTO users (username) VALUES (?)")
    .run(trimmed);

  return Response.json({
    id: result.lastInsertRowid,
    username: trimmed,
    points: 0,
  });
}
