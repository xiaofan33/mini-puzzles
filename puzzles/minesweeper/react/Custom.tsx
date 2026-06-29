import {} from 'react'
import { Shadcn } from '@/components/ui'
import type { BoardConfig } from '../model'
import type { UserOptions } from '../options'

function CustomBoardConfig(props: {
  defaultValue?: BoardConfig
  onConfirm: (config: BoardConfig) => void
}) {
  return (
    <>
      <Shadcn.DialogTitle>自定义</Shadcn.DialogTitle>

      <Shadcn.DialogFooter>
        <Shadcn.Button variant="outline">手气不错</Shadcn.Button>
        <Shadcn.Button onClick={() => {}}>确定</Shadcn.Button>
      </Shadcn.DialogFooter>
    </>
  )
}

export default function CustomDialog(props: {
  isOpen: boolean
  boardConfig?: BoardConfig
  close?: () => void
  onChange: (patch: Partial<UserOptions>) => void
}) {
  return (
    <>
      <Shadcn.Dialog open={props.isOpen}>
        <Shadcn.DialogContent showCloseButton={false}>
          <CustomBoardConfig
            defaultValue={props.boardConfig}
            onConfirm={b => {
              // props.onChange({ board: b })
              console.log('confirm:', b)
              props.close?.()
            }}
          />
        </Shadcn.DialogContent>
      </Shadcn.Dialog>
    </>
  )
}
