<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useBoardEvent } from './use'
import Block from './block.vue'
import type { Operation, Cell } from '../model'
import type { Settings } from '../theme'

const props = defineProps<{
  settings: Settings
  cellGrid: Cell[][]
  operate: (cell: Cell, op: Operation) => void
  getAdjacentCells: (cell: Cell) => Cell[]
}>()

const column = computed(() => props.cellGrid[0].length)
const stride = computed(() => props.settings.size + props.settings.gap)

const boardRef = useTemplateRef('board')

const { enableHighlight, pointerPosition } = useBoardEvent(boardRef, op => {
  const cell = hoveredCell.value
  if (!cell) return

  const { flagMode, fastMode } = props.settings

  if (flagMode && op === 'reveal') {
    props.operate(cell, 'toggle-flag')
    return
  }

  if (fastMode && op === 'reveal' && cell.state === 'revealed') {
    props.operate(cell, 'chord-reveal')
    return
  }

  props.operate(cell, op)
})

const hoveredCell = computed(() => {
  const { x, y } = pointerPosition.value
  const { size } = props.settings

  const col = Math.floor(x / stride.value)
  const row = Math.floor(y / stride.value)
  const offsetX = x - col * stride.value
  const offsetY = y - row * stride.value

  return offsetX <= size && offsetY <= size
    ? props.cellGrid[row]?.[col]
    : undefined
})

const highlightedCells = computed(() => {
  if (!enableHighlight.value) return

  const cell = hoveredCell.value
  if (!cell || cell.state === 'flagged') return

  if (cell.state === 'covered') return [cell]

  return props.getAdjacentCells(cell).filter(c => c.state === 'covered')
})
</script>

<template>
  <div
    :style="{
      '--cell-size': `${props.settings.size}px`,
      '--gap': `${props.settings.gap}px`,
      '--cell-font-size': `${props.settings.size * 0.6}px`,
      '--cell-rounded': `${props.settings.rounded}px`,
      '--columns': column,
    }"
    class="w-fit max-w-full overflow-auto p-1 text-(length:--cell-font-size)"
  >
    <div
      ref="board"
      class="grid grid-cols-[repeat(var(--columns),1fr)] gap-(--gap)"
    >
      <template v-for="(row, rowIndex) in props.cellGrid" :key="rowIndex">
        <Block
          v-for="cell in row"
          :key="cell.index"
          :palette="props.settings.palette"
          :highlighted="highlightedCells?.includes(cell)"
          v-bind="cell"
        />
      </template>
    </div>
  </div>
</template>
