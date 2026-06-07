"use client";

import { useState, useEffect, useCallback } from "react";
import LoginForm from "./LoginForm";
import PRCard from "./PRCard";
import Leaderboard from "./Leaderboard";

interface User {
  id: number;
  username: string;
  points: number;
}

interface PR {
  id: number;
  gh_number: number;
  title: string;
  author: string;
  body: string;
  url: string;
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

type Tab = "prs" | "leaderboard";

export default function ControlPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [prs, setPrs] = useState<PR[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [tab, setTab] = useState<Tab>("prs");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

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
    if (user) {
      fetchPRs();
      fetchLeaderboard();
    }
  }, [user, fetchPRs, fetchLeaderboard]);

  function handleLogin(u: User) {
    setUser(u);
  }

  function handleLogout() {
    localStorage.removeItem("btc_control_user");
    setUser(null);
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-sm font-black text-white">₿</span>
            </div>
            <div>
              <h1 className="text-sm font-black text-zinc-900 leading-none">
                Bitcoin Control
              </h1>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                i4RP/Bitcoin ガバナンス
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-700">{user.username}</p>
              <p className="text-[10px] text-amber-600 font-bold">
                {user.points} pt
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] text-zinc-400 hover:text-zinc-600"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-lg mx-auto px-4 pt-3">
        <div className="flex bg-zinc-100 rounded-xl p-1">
          <button
            onClick={() => setTab("prs")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              tab === "prs"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500"
            }`}
          >
            プルリクエスト
          </button>
          <button
            onClick={() => {
              setTab("leaderboard");
              fetchLeaderboard();
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              tab === "leaderboard"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500"
            }`}
          >
            ランキング
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {tab === "prs" && (
          <>
            {/* Filter */}
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
                ↻ 更新
              </button>
            </div>

            {/* PR list */}
            {loading ? (
              <div className="text-center text-zinc-400 text-sm py-12">
                読み込み中...
              </div>
            ) : filteredPrs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400 text-sm">PRがありません</p>
                <p className="text-zinc-300 text-xs mt-1">
                  i4RP/Bitcoin にPRが作成されると表示されます
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPrs.map((pr) => (
                  <PRCard
                    key={pr.id}
                    pr={pr}
                    userId={user.id}
                    onVoted={() => {
                      fetchPRs();
                      fetchLeaderboard();
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "leaderboard" && (
          <Leaderboard users={leaderboard} currentUserId={user.id} />
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-[10px] text-zinc-300">
          Bitcoin Control — i4RP/Bitcoin ガバナンス投票システム
        </p>
      </footer>
    </div>
  );
}
