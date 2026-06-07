import getDb from "@/lib/db";
import { fetchPullRequests } from "@/lib/github";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip";

export async function GET(request: NextRequest) {
  const db = getDb();
  const userId = request.nextUrl.searchParams.get("user_id");
  const ip = getClientIp(request);

  const ghPrs = await fetchPullRequests("all");

  for (const pr of ghPrs) {
    const existing = db
      .prepare("SELECT id FROM pull_requests WHERE gh_number = ?")
      .get(pr.number);

    if (!existing) {
      db.prepare(
        `INSERT INTO pull_requests (gh_number, title, author, body, url, status)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        pr.number,
        pr.title,
        pr.user.login,
        pr.body || "",
        pr.html_url,
        pr.state
      );
    } else {
      db.prepare(
        "UPDATE pull_requests SET status = ?, title = ? WHERE gh_number = ?"
      ).run(pr.state, pr.title, pr.number);
    }
  }

  const prs = db
    .prepare("SELECT * FROM pull_requests ORDER BY gh_number DESC")
    .all() as Array<{
    id: number;
    gh_number: number;
    title: string;
    author: string;
    body: string;
    url: string;
    status: string;
    resolved_as: string | null;
    created_at: string;
  }>;

  const result = prs.map((pr) => {
    const votes = db
      .prepare(
        `SELECT vote, COUNT(*) as count FROM votes WHERE pr_id = ? GROUP BY vote`
      )
      .all(pr.id) as Array<{ vote: string; count: number }>;

    const approveCount =
      votes.find((v) => v.vote === "approve")?.count || 0;
    const rejectCount =
      votes.find((v) => v.vote === "reject")?.count || 0;

    // Check vote by IP (primary) or user_id (fallback)
    let userVote: string | null = null;
    const ipVote = db
      .prepare("SELECT vote FROM votes WHERE ip_address = ? AND pr_id = ?")
      .get(ip, pr.id) as { vote: string } | undefined;
    if (ipVote) {
      userVote = ipVote.vote;
    } else if (userId) {
      const uv = db
        .prepare("SELECT vote FROM votes WHERE user_id = ? AND pr_id = ?")
        .get(Number(userId), pr.id) as { vote: string } | undefined;
      userVote = uv?.vote || null;
    }

    return {
      ...pr,
      approveCount,
      rejectCount,
      userVote,
    };
  });

  return Response.json(result);
}
