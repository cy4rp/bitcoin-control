"use client";

import { useState } from "react";

interface PRData {
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

interface Props {
  pr: PRData;
  userId: number | null;
  onVoted: () => void;
}

export default function PRCard({ pr, userId, onVoted }: Props) {
  const [voting, setVoting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [ipError, setIpError] = useState(false);

  const total = pr.approveCount + pr.rejectCount;
  const approvePercent = total > 0 ? (pr.approveCount / total) * 100 : 50;
  const rejectPercent = total > 0 ? (pr.rejectCount / total) * 100 : 50;

  const isResolved = !!pr.resolved_as;

  async function handleVote(vote: "approve" | "reject") {
    if (!userId || voting || isResolved) return;
    setVoting(true);
    setIpError(false);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, pr_id: pr.id, vote }),
      });
      if (res.status === 403) {
        setIpError(true);
        return;
      }
      onVoted();
    } finally {
      setVoting(false);
    }
  }

  const statusBadge = isResolved
    ? pr.resolved_as === "approve"
      ? { text: "承認済み", color: "bg-emerald-500" }
      : { text: "却下", color: "bg-red-500" }
    : pr.status === "open"
      ? { text: "投票受付中", color: "bg-amber-500" }
      : { text: "クローズ", color: "bg-zinc-500" };

  return (
    <div className="bg-white border-[2px] border-zinc-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`${statusBadge.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}
              >
                {statusBadge.text}
              </span>
              <span className="text-zinc-400 text-xs font-mono">
                #{pr.pr_number}
              </span>
              {pr.branch && (
                <span className="text-[10px] text-blue-500 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                  {pr.branch} → {pr.base_branch || "initial"}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-zinc-900 leading-snug">
              {pr.title}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              by{" "}
              <span className="font-medium text-zinc-700">{pr.author}</span>
              <span className="text-zinc-300 ml-2">{pr.repo}</span>
            </p>
          </div>
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
              {expanded ? "閉じる" : "詳細を見る"}
            </span>
          </button>
        )}

        {/* Diff viewer */}
        {pr.diff_text && (
          <div className="mt-2">
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="text-xs text-zinc-400 font-mono hover:text-zinc-600"
            >
              {showDiff ? "diff を閉じる" : "diff を見る"}
            </button>
            {showDiff && (
              <pre className="mt-2 p-3 bg-zinc-900 text-zinc-300 text-[11px] font-mono rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                {pr.diff_text}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Vote bar */}
      <div className="px-4 sm:px-5 pb-2">
        <div className="flex justify-between text-[11px] font-bold mb-1">
          <span className="text-emerald-600">許可 {pr.approveCount}</span>
          <span className="text-red-500">却下 {pr.rejectCount}</span>
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

      {/* IP duplicate warning */}
      {ipError && (
        <div className="px-4 py-2 bg-orange-50 border-t border-orange-100 text-center">
          <p className="text-xs font-bold text-orange-600">
            この IP アドレスは既に投票済みです（1 IP = 1 票）
          </p>
        </div>
      )}

      {/* Vote buttons */}
      {!isResolved && userId && !ipError && (
        <div className="flex border-t border-zinc-100">
          <button
            onClick={() => handleVote("approve")}
            disabled={voting}
            className={`flex-1 py-3 text-sm font-bold transition-all
              ${
                pr.userVote === "approve"
                  ? "bg-emerald-50 text-emerald-700 border-r border-zinc-100"
                  : "text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 border-r border-zinc-100"
              }`}
          >
            {pr.userVote === "approve" ? "許可済" : "許可"}
          </button>
          <button
            onClick={() => handleVote("reject")}
            disabled={voting}
            className={`flex-1 py-3 text-sm font-bold transition-all
              ${
                pr.userVote === "reject"
                  ? "bg-red-50 text-red-700"
                  : "text-zinc-500 hover:bg-red-50 hover:text-red-600"
              }`}
          >
            {pr.userVote === "reject" ? "却下済" : "却下"}
          </button>
        </div>
      )}

      {/* Not logged in hint */}
      {!isResolved && !userId && (
        <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-center">
          <p className="text-[11px] text-zinc-400">
            投票するにはユーザー名を入力してください
          </p>
        </div>
      )}

      {/* Resolution result */}
      {isResolved && (
        <div
          className={`px-4 py-3 text-sm font-bold text-center border-t
            ${
              pr.resolved_as === "approve"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-red-50 text-red-700 border-red-100"
            }`}
        >
          {pr.resolved_as === "approve"
            ? "このPRは許可されました — 多数派に +10 pt"
            : "このPRは却下されました — 多数派に +10 pt"}
        </div>
      )}
    </div>
  );
}
