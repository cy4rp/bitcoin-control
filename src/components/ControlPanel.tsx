"use client";

import { useState, useEffect, useCallback } from "react";
import PRCard from "./PRCard";
import Leaderboard from "./Leaderboard";

interface User {
  id: number;
  username: string;
  points: number;
}

interface PR {
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
  approveCount: number;
  rejectCount: number;
  userVote: string | null;
}

interface LeaderboardUser {
  id: number;
  username: string;
  points: number;
  total_votes: number;
}

export default function ControlPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [prs, setPrs] = useState<PR[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [showRanking, setShowRanking] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("btc_control_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("btc_control_user");
      }
    }
  }, []);

  const fetchPRs = useCallback(async () => {
    setLoading(true);
    try {
      const url = user ? `/api/prs?user_id=${user.id}` : "/api/prs";
      const res = await fetch(url);
      const data = await res.json();
      setPrs(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchPRs();
    fetchLeaderboard();
  }, [fetchPRs, fetchLeaderboard]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginName.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "エラー");
        return;
      }
      localStorage.setItem("btc_control_user", JSON.stringify(data));
      setUser(data);
      setLoginName("");
    } catch {
      setLoginError("接続エラー");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("btc_control_user");
    setUser(null);
  }

  const filteredPrs =
    filter === "all"
      ? prs
      : filter === "open"
        ? prs.filter((p) => !p.resolved_as)
        : prs.filter((p) => !!p.resolved_as);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-sm font-black text-black">B</span>
            </div>
            <div>
              <h1 className="text-sm font-black leading-none tracking-tight">
                Bitcoin Source Hub
              </h1>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Pull Request ガバナンス
              </p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRanking(!showRanking)}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider"
              >
                Ranking
              </button>
              <div className="text-right">
                <p className="text-xs font-bold">{user.username}</p>
                <p className="text-[10px] text-amber-400 font-bold">
                  {user.points} pt
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                OUT
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="flex items-center gap-2">
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="ユーザー名"
                maxLength={30}
                className="w-28 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={loginLoading || !loginName.trim()}
                className="px-3 py-1.5 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400 disabled:opacity-40"
              >
                参加
              </button>
            </form>
          )}
        </div>
        {loginError && (
          <div className="max-w-2xl mx-auto px-4 pb-2">
            <p className="text-xs text-red-400">{loginError}</p>
          </div>
        )}
      </header>

      {/* Git clone info bar */}
      <div className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
          <code className="text-[11px] font-mono">
            git clone {typeof window !== "undefined" ? window.location.origin : ""}/git/Bitcoin
          </code>
          <span className="text-[10px] text-zinc-600">
            POST /api/hub/prs で PR 作成
          </span>
        </div>
      </div>

      {/* Ranking overlay */}
      {showRanking && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-white border-[2px] border-black rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black">ランキング</h2>
              <button
                onClick={() => setShowRanking(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                閉じる
              </button>
            </div>
            <Leaderboard
              users={leaderboard}
              currentUserId={user?.id ?? null}
            />
          </div>
        </div>
      )}

      {/* Filter + refresh */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          {(["all", "open", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                filter === f
                  ? "bg-black text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {f === "all" ? "すべて" : f === "open" ? "投票中" : "確定済み"}
            </button>
          ))}
          <button
            onClick={fetchPRs}
            className="ml-auto px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            更新
          </button>
        </div>
      </div>

      {/* PR list */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center text-zinc-400 text-sm py-12">
            読み込み中...
          </div>
        ) : filteredPrs.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-100 rounded-2xl mb-4">
              <span className="text-2xl font-black text-zinc-300">PR</span>
            </div>
            <p className="text-zinc-400 text-sm font-bold">
              プルリクエストがありません
            </p>
            <p className="text-zinc-300 text-xs mt-2 max-w-xs mx-auto">
              エージェントや開発者が git push 後に POST /api/hub/prs で PR を作成すると、ここに表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrs.map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                userId={user?.id ?? null}
                onVoted={() => {
                  fetchPRs();
                  fetchLeaderboard();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center border-t border-zinc-100">
        <p className="text-[10px] text-zinc-300">
          Bitcoin Source Hub — ソースコード ガバナンス投票システム
        </p>
        <p className="text-[10px] text-zinc-300 mt-1">
          1 IP = 1 票 / 多数派に +10 pt
        </p>
      </footer>
    </div>
  );
}
