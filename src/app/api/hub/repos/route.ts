import { NextRequest } from "next/server";
import getDb from "@/lib/db";
import { initBareRepo, listRepos, getRepoBranches } from "@/lib/git";

export async function GET() {
  const repoNames = listRepos();
  const db = getDb();

  const repos = repoNames.map((name) => {
    const row = db
      .prepare("SELECT * FROM repos WHERE name = ?")
      .get(name) as
      | { name: string; description: string; default_branch: string }
      | undefined;

    return {
      name,
      description: row?.description || "",
      default_branch: row?.default_branch || "initial",
      branches: getRepoBranches(name),
    };
  });

  return Response.json(repos);
}

export async function POST(request: NextRequest) {
  const { name, description, default_branch } = await request.json();

  if (!name || typeof name !== "string") {
    return Response.json(
      { error: "リポジトリ名が必要です" },
      { status: 400 }
    );
  }

  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeName) {
    return Response.json(
      { error: "無効なリポジトリ名" },
      { status: 400 }
    );
  }

  const branch = default_branch || "initial";
  initBareRepo(safeName, branch);

  const db = getDb();
  try {
    db.prepare(
      "INSERT INTO repos (name, description, default_branch) VALUES (?, ?, ?)"
    ).run(safeName, description || "", branch);
  } catch {
    // already exists in db
    db.prepare(
      "UPDATE repos SET description = ?, default_branch = ? WHERE name = ?"
    ).run(description || "", branch, safeName);
  }

  return Response.json({
    name: safeName,
    description: description || "",
    default_branch: branch,
    git_url: `/git/${safeName}`,
  });
}
