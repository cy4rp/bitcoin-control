import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();

  const leaderboard = db
    .prepare(
      `SELECT id, username, points,
        (SELECT COUNT(*) FROM votes WHERE votes.user_id = users.id) as total_votes
       FROM users
       ORDER BY points DESC, total_votes DESC
       LIMIT 50`
    )
    .all();

  return Response.json(leaderboard);
}
