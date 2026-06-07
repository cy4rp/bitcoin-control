import { NextRequest } from "next/server";
import getDb from "@/lib/db";

export async function POST(request: NextRequest) {
  const { pr_id, resolution } = await request.json();

  if (!pr_id || !resolution) {
    return Response.json({ error: "パラメータ不足" }, { status: 400 });
  }

  if (resolution !== "approve" && resolution !== "reject") {
    return Response.json(
      { error: "resolution は approve または reject" },
      { status: 400 }
    );
  }

  const db = getDb();

  const pr = db
    .prepare("SELECT * FROM pull_requests WHERE id = ?")
    .get(pr_id) as { id: number; resolved_as: string | null } | undefined;

  if (!pr) {
    return Response.json({ error: "PRが見つかりません" }, { status: 404 });
  }

  db.prepare(
    "UPDATE pull_requests SET resolved_as = ?, closed_at = datetime('now') WHERE id = ?"
  ).run(resolution, pr_id);

  const winners = db
    .prepare("SELECT user_id FROM votes WHERE pr_id = ? AND vote = ?")
    .all(pr_id, resolution) as Array<{ user_id: number }>;

  const POINTS_PER_WIN = 10;

  for (const w of winners) {
    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(
      POINTS_PER_WIN,
      w.user_id
    );
  }

  return Response.json({
    resolved_as: resolution,
    winners_count: winners.length,
    points_awarded: POINTS_PER_WIN,
  });
}
