import { Suspense, lazy } from 'react'
import { Link, useParams } from 'react-router-dom'
import { games, gameMap } from '@/games'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { NotFound } from '@/pages/NotFound'

// Lazy-load each game's entry component. React.lazy needs a default export.
const lazyGames = Object.fromEntries(
  games
    .filter(g => g.loader)
    .map(g => [
      g.id,
      lazy(() => g.loader!().then(m => ({ default: m.default }))),
    ]),
)

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const meta = gameId ? gameMap[gameId] : undefined

  if (!meta || !meta.loader) {
    return <NotFound />
  }

  const Game = lazyGames[meta.id]

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/" aria-label="返回菜单">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{meta.name}</h1>
      </div>

      <Suspense fallback={<div className="text-muted-foreground">加载中…</div>}>
        <Game />
      </Suspense>
    </div>
  )
}
