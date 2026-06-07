"use client";

interface User {
  id: number;
  username: string;
  points: number;
  total_votes: number;
}

interface Props {
  users: User[];
  currentUserId: number | null;
}

export default function Leaderboard({ users, currentUserId }: Props) {
  if (users.length === 0) {
    return (
      <div className="text-center text-zinc-400 text-sm py-8">
        まだ投票がありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user, i) => {
        const isCurrent = user.id === currentUserId;
        const rank = i + 1;
        const medal =
          rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

        return (
          <div
            key={user.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              ${isCurrent
                ? "bg-amber-50 border-2 border-amber-300"
                : "bg-white border border-zinc-100"
              }`}
          >
            <div className="w-8 text-center shrink-0">
              {medal ? (
                <span className="text-lg">{medal}</span>
              ) : (
                <span className="text-sm font-bold text-zinc-400">{rank}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-bold truncate ${isCurrent ? "text-amber-800" : "text-zinc-800"}`}
              >
                {user.username}
                {isCurrent && (
                  <span className="text-[10px] text-amber-600 ml-1.5 font-normal">
                    (あなた)
                  </span>
                )}
              </p>
              <p className="text-[11px] text-zinc-400">{user.total_votes} 回投票</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-zinc-900">{user.points}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                pt
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
