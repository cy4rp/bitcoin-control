"use client";

import { useState } from "react";

interface PRData {
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

interface Props {
  pr: PRData;
  userId: number | null;
  onVoted: () => void;
}

export default function PRCard({ pr, userId, onVoted }: Props) {
  const [voting, setVoting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const total = pr.approveCount + pr.rejectCount;
  const approvePercent = total > 0 ? (pr.approveCount / total) * 100 : 50;
  const rejectPercent = total > 0 ? (pr.rejectCount / total) * 100 : 50;

  const isResolved = !!pr.resolved_as;
  const isOpen = pr.status === "open";

  async function handleVote(vote: "approve" | "reject") {
    if (!userId || voting || isResolved) return;
    setVoting(true);
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, pr_id: pr.id, vote }),
      });
      onVoted();
    } finally {
      setVoting(false);
    }
  }

  const statusBadge = isResolved
    ? pr.resolved_as === "approve"
      ? { text: "承認済み", color: "bg-emerald-500" }
      : { text: "却下", color: "bg-red-500" }
    : isOpen
      ? { text: "投票受付中", color: "bg-amber-500" }
      : { text: "クローズ", color: "bg-zinc-500" };

  return (
    <div className="bg-white border-[2px] border-zinc-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`${statusBadge.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}
              >
                {statusBadge.text}
              </span>
              <span className="text-zinc-400 text-xs font-mono">
                #{pr.gh_number}
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-900 leading-snug">
              {pr.title}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              by <span className="font-medium text-zinc-700">{pr.author}</span>
            </p>
          </div>
          <a
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors"
            title="GitHubで見る"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>

        {/* Body preview */}
        {pr.body && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-left w-full"
          >
            <p
              className={`text-sm text-zinc-600 ${expanded ? "" : "line-clamp-2"}`}
            >
              {pr.body}
            </p>
            <span className="text-xs text-blue-500 font-medium mt-1 inline-block">
              {expanded ? "▲ 閉じる" : "▼ 詳細を見る"}
            </span>
          </button>
        )}
      </div>

      {/* Vote bar */}
      <div className="px-4 sm:px-5 pb-2">
        <div className="flex justify-between text-[11px] font-bold mb-1">
          <span className="text-emerald-600">
            許可 {pr.approveCount}
          </span>
          <span className="text-red-500">
            却下 {pr.rejectCount}
          </span>
        </div>
        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden flex">
          {total > 0 ? (
            <>
              <div
                className="bg-emerald-400 transition-all duration-500"
                style={{ width: `${approvePercent}%` }}
              />
              <div
                className="bg-red-400 transition-all duration-500"
                style={{ width: `${rejectPercent}%` }}
              />
            </>
          ) : (
            <div className="bg-zinc-200 w-full" />
          )}
        </div>
        {total > 0 && (
          <p className="text-[10px] text-zinc-400 mt-0.5 text-center">
            {total} 票
          </p>
        )}
      </div>

      {/* Vote buttons */}
      {!isResolved && userId && (
        <div className="flex border-t border-zinc-100">
          <button
            onClick={() => handleVote("approve")}
            disabled={voting}
            className={`flex-1 py-3 text-sm font-bold transition-all
              ${pr.userVote === "approve"
                ? "bg-emerald-50 text-emerald-700 border-r border-zinc-100"
                : "text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 border-r border-zinc-100"
              }`}
          >
            {pr.userVote === "approve" ? "✓ 許可" : "許可"}
          </button>
          <button
            onClick={() => handleVote("reject")}
            disabled={voting}
            className={`flex-1 py-3 text-sm font-bold transition-all
              ${pr.userVote === "reject"
                ? "bg-red-50 text-red-700"
                : "text-zinc-500 hover:bg-red-50 hover:text-red-600"
              }`}
          >
            {pr.userVote === "reject" ? "✓ 却下" : "却下"}
          </button>
        </div>
      )}

      {/* Resolution result */}
      {isResolved && (
        <div
          className={`px-4 py-3 text-sm font-bold text-center border-t
            ${pr.resolved_as === "approve"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100"
            }`}
        >
          {pr.resolved_as === "approve"
            ? "✓ このPRは許可されました — 多数派に +10 pt"
            : "✕ このPRは却下されました — 多数派に +10 pt"}
        </div>
      )}
    </div>
  );
}
