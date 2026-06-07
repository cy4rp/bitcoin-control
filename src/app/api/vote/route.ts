import { NextRequest } from "next/server";
import getDb from "@/lib/db";

export async function POST(request: NextRequest) {
  const { user_id, pr_id, vote } = await request.json();

  if (!user_id || !pr_id || !vote) {
    return Response.json({ error: "パラメータ不足" }, { status: 400 });
  }

  if (vote !== "approve" && vote !== "reject") {
    return Response.json(
      { error: "投票は approve または reject" },
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

  if (pr.resolved_as) {
    return Response.json(
      { error: "この PR の投票は既に確定しています" },
      { status: 400 }
    );
  }

  const existing = db
    .prepare("SELECT id FROM votes WHERE user_id = ? AND pr_id = ?")
    .get(user_id, pr_id);

  if (existing) {
    db.prepare("UPDATE votes SET vote = ? WHERE user_id = ? AND pr_id = ?").run(
      vote,
      user_id,
      pr_id
    );
  } else {
    db.prepare(
      "INSERT INTO votes (user_id, pr_id, vote) VALUES (?, ?, ?)"
    ).run(user_id, pr_id, vote);
  }

  const votes = db
    .prepare(
      "SELECT vote, COUNT(*) as count FROM votes WHERE pr_id = ? GROUP BY vote"
    )
    .all(pr_id) as Array<{ vote: string; count: number }>;

  const approveCount = votes.find((v) => v.vote === "approve")?.count || 0;
  const rejectCount = votes.find((v) => v.vote === "reject")?.count || 0;

  return Response.json({ approveCount, rejectCount, userVote: vote });
}
