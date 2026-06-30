import { useState } from 'react'
import { Shadcn } from '@/components/ui'
import { mineBounds, randomBoardConfig } from '../utils'
import type { UserOptions } from '../options'
import { boardBounds } from '../assets/config.json'

function clampMine(value: number, total: number) {
  const [min, max] = mineBounds(total)
  return Math.max(min, Math.min(max, value))
}

function FieldItem(props: {
  label: string
  value: number
  displayValue?: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  suffix?: React.ReactNode
}) {
  const {
    label,
    value,
    displayValue,
    min,
    max,
    step = 1,
    onChange,
    suffix,
  } = props

  return (
    <Shadcn.Field>
      <div className="flex items-center gap-2">
        <span className="">{label}</span>
        <span className="text-right tabular-nums">{displayValue ?? value}</span>
        {suffix}
      </div>
      <div className="flex items-center gap-3 select-none">
        <Shadcn.Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={v => onChange(Array.isArray(v) ? v[0] : v)}
        />
        <Shadcn.ButtonGroup>
          <Shadcn.Button
            disabled={value <= min}
            variant="outline"
            size="sm"
            onClick={() => onChange(value - step)}
          >
            <i className="i-lucide-minus" />
          </Shadcn.Button>
          <Shadcn.Button
            disabled={value >= max}
            variant="outline"
            size="sm"
            onClick={() => onChange(value + step)}
          >
            <i className="i-lucide-plus" />
          </Shadcn.Button>
        </Shadcn.ButtonGroup>
      </div>
    </Shadcn.Field>
  )
}

export default function CustomDialog(props: {
  isOpen: boolean
  defaultValue: UserOptions
  onOpenChange: (v: boolean) => void
  onConfirm: (patch: Partial<UserOptions>) => void
}) {
  const { isOpen, defaultValue, onOpenChange } = props

  const [board, setBoard] = useState(defaultValue.board)
  const [isDensityLocked, setDensityLocked] = useState(defaultValue.lockDensity)
  const [pinnedDensity, setPinnedDensity] = useState(
    defaultValue.lockDensity
      ? defaultValue.board.m / (defaultValue.board.w * defaultValue.board.h)
      : 0,
  )

  const total = board.w * board.h
  const [minM, maxM] = mineBounds(total)
  const minDensity = minM / total
  const maxDensity = maxM / total
  const mineDensity = isDensityLocked ? pinnedDensity : board.m / total

  const mineSliderMin = isDensityLocked
    ? boardBounds.minDensity / 100
    : minDensity
  const mineSliderMax = isDensityLocked
    ? boardBounds.maxDensity / 100
    : maxDensity
  const mineSliderStep = isDensityLocked ? 0.001 : 1 / total

  function handleLockChange(checked: boolean) {
    if (checked) {
      setPinnedDensity(board.m / total)
    }
    setDensityLocked(checked)
  }

  function handleBoardChange(key: 'w' | 'h', value: number) {
    const nextBoard = { ...board, [key]: value }
    const nextTotal = nextBoard.w * nextBoard.h
    const density = isDensityLocked ? pinnedDensity : nextBoard.m / nextTotal
    const m = clampMine(Math.round(density * nextTotal), nextTotal)
    setBoard({ ...nextBoard, m })
  }

  function handleMineChange(density: number) {
    const m = clampMine(Math.round(density * total), total)
    if (isDensityLocked) setPinnedDensity(density)
    setBoard({ ...board, m })
  }

  function handleGoodLuck() {
    const next = randomBoardConfig()
    setBoard(next)
    if (isDensityLocked) setPinnedDensity(next.m / (next.w * next.h))
  }

  function handleSubmit() {
    props.onConfirm({ board, lockDensity: isDensityLocked })
    onOpenChange(false)
  }

  return (
    <Shadcn.Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Shadcn.DialogContent className="max-w-xs">
        <Shadcn.DialogHeader>
          <Shadcn.DialogTitle>自定义</Shadcn.DialogTitle>
        </Shadcn.DialogHeader>
        <Shadcn.Separator />
        <Shadcn.FieldGroup className="gap-4">
          <FieldItem
            label="宽"
            value={board.w}
            min={boardBounds.minW}
            max={boardBounds.maxW}
            onChange={v => handleBoardChange('w', v)}
          />
          <FieldItem
            label="高"
            value={board.h}
            min={boardBounds.minH}
            max={boardBounds.maxH}
            onChange={v => handleBoardChange('h', v)}
          />
          <FieldItem
            label="雷"
            value={mineDensity}
            displayValue={board.m}
            min={mineSliderMin}
            max={mineSliderMax}
            step={mineSliderStep}
            onChange={handleMineChange}
            suffix={
              <span className="text-muted-foreground flex items-center gap-0.5 pl-1">
                {isDensityLocked && <i className="i-lucide-lock text-xs" />}
                <span>{(mineDensity * 100).toFixed(2)}%</span>
              </span>
            }
          />
          <Shadcn.Field orientation="horizontal">
            <Shadcn.Switch
              id="lock-density"
              checked={isDensityLocked}
              onCheckedChange={handleLockChange}
            />
            <Shadcn.Label htmlFor="lock-density">锁定密度</Shadcn.Label>
          </Shadcn.Field>
        </Shadcn.FieldGroup>
        <Shadcn.DialogFooter>
          <Shadcn.Button variant="outline" onClick={handleGoodLuck}>
            手气不错
          </Shadcn.Button>
          <Shadcn.Button onClick={handleSubmit}>确定</Shadcn.Button>
        </Shadcn.DialogFooter>
      </Shadcn.DialogContent>
    </Shadcn.Dialog>
  )
}
