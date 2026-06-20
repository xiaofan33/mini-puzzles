import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-muted-foreground text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">找不到这个游戏。</p>
      <Button asChild>
        <Link to="/">返回菜单</Link>
      </Button>
    </div>
  )
}
