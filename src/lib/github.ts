const REPO_OWNER = "i4RP";
const REPO_NAME = "Bitcoin";
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

export interface GHPullRequest {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  merged: boolean;
  user: { login: string };
  created_at: string;
  updated_at: string;
  changed_files?: number;
  additions?: number;
  deletions?: number;
}

export async function fetchPullRequests(
  state: "open" | "closed" | "all" = "all"
): Promise<GHPullRequest[]> {
  const res = await fetch(`${API_BASE}/pulls?state=${state}&per_page=100`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "BitcoinControl/1.0",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPullRequest(
  number: number
): Promise<GHPullRequest | null> {
  const res = await fetch(`${API_BASE}/pulls/${number}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "BitcoinControl/1.0",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}
