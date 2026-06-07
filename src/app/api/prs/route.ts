import getDb from "@/lib/db";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip";

export async function GET(request: NextRequest) {
  const db = getDb();
  const userId = request.nextUrl.searchParams.get("user_id");
  const repo = request.nextUrl.searchParams.get("repo") || "Bitcoin";
  const ip = getClientIp(request);

  const prs = db
    .prepare(
      "SELECT * FROM pull_requests WHERE repo = ? ORDER BY pr_number DESC"
    )
    .all(repo) as Array<{
    id: number;
    pr_number: number;
    repo: string;
    title: string;
    author: string;
    body: string;
    branch: string;
    base_branch: string;
    diff_text: string;
    status: string;
    resolved_as: string | null;
    created_at: string;
  }>;

  const result = prs.map((pr) => {
    const votes = db
      .prepare(
        "SELECT vote, COUNT(*) as count FROM votes WHERE pr_id = ? GROUP BY vote"
      )
      .all(pr.id) as Array<{ vote: string; count: number }>;

    const approveCount =
      votes.find((v) => v.vote === "approve")?.count || 0;
    const rejectCount =
      votes.find((v) => v.vote === "reject")?.count || 0;

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
