import { NextRequest } from "next/server";
import getDb from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = getDb();
  const repo = request.nextUrl.searchParams.get("repo") || "Bitcoin";

  const prs = db
    .prepare(
      "SELECT * FROM pull_requests WHERE repo = ? ORDER BY pr_number DESC"
    )
    .all(repo);

  return Response.json(prs);
}

export async function POST(request: NextRequest) {
  const { repo, title, body, author, branch, base_branch, diff } =
    await request.json();

  if (!title || !author) {
    return Response.json(
      { error: "title と author は必須です" },
      { status: 400 }
    );
  }

  const repoName = repo || "Bitcoin";
  const db = getDb();

  const maxRow = db
    .prepare(
      "SELECT COALESCE(MAX(pr_number), 0) as max_num FROM pull_requests WHERE repo = ?"
    )
    .get(repoName) as { max_num: number };

  const prNumber = maxRow.max_num + 1;

  const result = db
    .prepare(
      `INSERT INTO pull_requests (pr_number, repo, title, author, body, branch, base_branch, diff_text, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`
    )
    .run(
      prNumber,
      repoName,
      title,
      author,
      body || "",
      branch || "",
      base_branch || "initial",
      diff || ""
    );

  return Response.json({
    id: result.lastInsertRowid,
    pr_number: prNumber,
    repo: repoName,
    title,
    author,
    body: body || "",
    branch: branch || "",
    base_branch: base_branch || "initial",
    status: "open",
  });
}
