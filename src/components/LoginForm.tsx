"use client";

import { useState } from "react";

interface Props {
  onLogin: (user: { id: number; username: string; points: number }) => void;
}

export default function LoginForm({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }
      localStorage.setItem("btc_control_user", JSON.stringify(data));
      onLogin(data);
    } catch {
      setError("接続エラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4">
            <span className="text-2xl font-black text-white">₿</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900">
            Bitcoin Control
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            プルリクエスト ガバナンス投票
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="名前を入力..."
              maxLength={30}
              className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl text-zinc-900 text-sm font-medium placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold transition-all hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "参加する"}
          </button>
        </form>

        <p className="text-center text-[11px] text-zinc-400 mt-6">
          i4RP/Bitcoin リポジトリのPRに投票し
          <br />
          多数派に入るとポイントを獲得できます
        </p>
      </div>
    </div>
  );
}
