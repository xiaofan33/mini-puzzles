import { Construction } from 'lucide-react'

/**
 * Placeholder shown for games that haven't been built yet.
 * Each demo's index.tsx will re-export this until it gets its own implementation.
 */
export function ComingSoon({ name }: { name: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <Construction className="text-muted-foreground size-10" />
      <h2 className="text-xl font-semibold">{name}</h2>
      <p className="text-muted-foreground">这个游戏正在开发中，敬请期待。</p>
    </div>
  )
}
