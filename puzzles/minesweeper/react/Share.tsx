import { useRef, useState } from 'react'
import { Shadcn } from '@/components/ui'
import { formatDuration } from '@/lib/utils'
import { buildShareUrl } from '../utils'
import type { GameProps } from '../model'

export interface ShareData extends GameProps {
  flagCount: number
}

const INFO_ITEMS = [
  {
    icon: 'i-lucide-grid-2x2',
    text: '宽高',
    getValue: (d: ShareData) => `${d.w} x ${d.h}`,
  },
  {
    icon: 'i-lucide-bomb',
    text: '密度',
    getValue: (d: ShareData) => `${((d.m / (d.w * d.h)) * 100).toFixed(2)}%`,
  },
  {
    icon: 'i-lucide-flag',
    text: '插旗比',
    getValue: (d: ShareData) => `${d.flagCount} : ${d.m}`,
  },
  {
    icon: 'i-lucide-timer',
    text: '已用时',
    getValue: (d: ShareData) =>
      d.elapsedTime ? formatDuration(Math.floor(d.elapsedTime / 1000)) : 'N/A',
  },
]

export default function Share(props: {
  flagCount: number
  onDump: () => GameProps
}) {
  const { flagCount, onDump } = props

  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareData, setShareData] = useState<ShareData | null>(null)

  function handleShare() {
    const data = onDump()
    setShareData({ ...data, flagCount })
    setOpen(true)
  }

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  async function handleCopy() {
    if (!shareData) return

    const shareUrl = buildShareUrl(shareData)
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      return
    }
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCopied(false)
      setOpen(false)
    }, 1200)
  }

  function handleLink() {
    if (!shareData) return

    const shareUrl = buildShareUrl(shareData)
    window.open(shareUrl, '_blank')
  }

  return (
    <Shadcn.Popover open={open} onOpenChange={setOpen}>
      <Shadcn.PopoverTrigger
        render={
          <Shadcn.Button variant="ghost" size="icon-lg" onClick={handleShare} />
        }
      >
        <i className="i-lucide-share-2" />
      </Shadcn.PopoverTrigger>
      <Shadcn.PopoverContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            已生成当前局面的分享链接
          </div>
          <Shadcn.Separator />
          <div className="mb-2 space-y-2">
            {INFO_ITEMS.map(item => (
              <div key={item.icon} className="flex items-center gap-2">
                <i className={`${item.icon}`} />
                <span className="text-muted-foreground w-28 text-sm">
                  {item.text}
                </span>
                <span className="mr-auto font-mono text-sm tracking-wider">
                  {shareData && item.getValue(shareData)}
                </span>
              </div>
            ))}
          </div>
          <Shadcn.Button variant="default" onClick={handleCopy}>
            <i className={copied ? 'i-lucide-check' : 'i-lucide-copy'} />
            {copied ? '已复制' : '复制链接'}
          </Shadcn.Button>
          <Shadcn.Button variant="outline" onClick={handleLink}>
            <i className="i-lucide-external-link" />
            在新标签打开
          </Shadcn.Button>
        </div>
      </Shadcn.PopoverContent>
    </Shadcn.Popover>
  )
}
