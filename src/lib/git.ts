import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const REPOS_DIR =
  process.env.REPOS_DIR || /* turbopackIgnore: true */ "/data/repos";

export function getReposDir(): string {
  if (!fs.existsSync(REPOS_DIR)) {
    fs.mkdirSync(REPOS_DIR, { recursive: true });
  }
  return REPOS_DIR;
}

export function getRepoPath(repoName: string): string | null {
  const repoPath = path.join(getReposDir(), `${repoName}.git`);
  if (fs.existsSync(repoPath)) return repoPath;
  return null;
}

export function initBareRepo(
  repoName: string,
  defaultBranch = "initial"
): string {
  const repoPath = path.join(getReposDir(), `${repoName}.git`);
  if (fs.existsSync(repoPath)) return repoPath;

  execSync(`git init --bare "${repoPath}"`);
  execSync(`git -C "${repoPath}" config http.receivepack true`);
  execSync(
    `git -C "${repoPath}" symbolic-ref HEAD refs/heads/${defaultBranch}`
  );

  return repoPath;
}

export function listRepos(): string[] {
  const dir = getReposDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(
      (f) =>
        f.endsWith(".git") &&
        fs.statSync(path.join(dir, f)).isDirectory()
    )
    .map((f) => f.replace(/\.git$/, ""));
}

export function getRepoBranches(repoName: string): string[] {
  const repoPath = getRepoPath(repoName);
  if (!repoPath) return [];
  try {
    const output = execSync(`git -C "${repoPath}" branch`, {
      encoding: "utf-8",
    });
    return output
      .split("\n")
      .map((b) => b.trim().replace(/^\* /, ""))
      .filter((b) => b.length > 0);
  } catch {
    return [];
  }
}

export function pktLine(data: string): string {
  const len = (4 + data.length).toString(16).padStart(4, "0");
  return len + data;
}
