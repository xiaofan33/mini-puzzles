import { Link } from 'react-router-dom'
import { games, type GameStatus } from '@/games'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const statusLabel: Record<GameStatus, string> = {
  'planned': '待开发',
  'in-progress': '开发中',
  'done': '可玩',
}

const statusClass: Record<GameStatus, string> = {
  'planned': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-accent text-accent-foreground',
  'done': 'bg-primary/10 text-primary',
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Mini Puzzles</h1>
        <p className="text-muted-foreground mt-2"></p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map(game => {
          const Icon = game.icon
          const disabled = game.status === 'planned'
          return (
            <Card
              key={game.id}
              className={cn(
                'transition-all',
                disabled
                  ? 'opacity-60'
                  : 'hover:border-primary/50 hover:shadow-md',
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs',
                      statusClass[game.status],
                    )}
                  >
                    {statusLabel[game.status]}
                  </span>
                </div>
                <CardTitle className="mt-3">{game.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {game.description}
                </p>
                {disabled ? (
                  <span className="text-muted-foreground mt-4 inline-block text-sm">
                    即将上线
                  </span>
                ) : (
                  <Link
                    to={`/play/${game.id}`}
                    className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
                  >
                    开始游戏 →
                  </Link>
                )}
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
