const medals = ['🥇', '🥈', '🥉'];

export default function RankingList({ users, limit }) {
  const displayUsers = limit ? users.slice(0, limit) : users;

  return (
    <div className="space-y-3">
      {displayUsers && displayUsers.length > 0 ? (
        displayUsers.map((user) => (
          <div key={user.position} className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 card-hover">
            <span className="w-8 text-center text-lg font-bold">
              {user.position <= 3 ? medals[user.position - 1] : `#${user.position}`}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {user.avatar}
            </div>
            <div className="flex-1">
              <p className="font-medium text-muted-87">{user.name}</p>
            </div>
            <div className="text-right">
              <p className="font-timer text-sm font-semibold text-accent">
                {user.hours}h {user.minutes}min
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-muted-foreground">Nenhum usuário encontrado.</p>
      )}
    </div>
  );
}
