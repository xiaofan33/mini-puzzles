import {} from 'react'
import { Shadcn } from '@/components/ui'
import type { BoardConfig } from '../model'
import type { UserOptions } from '../options'

export default function CustomDialog(props: {
  isOpen: boolean
  boardConfig?: BoardConfig
  close?: () => void
  onChange: (patch: Partial<UserOptions>) => void
}) {
  return <></>
}
