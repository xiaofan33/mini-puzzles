import { Shadcn } from '@/components/ui'
import type { BoardConfig } from '../model'

export default function CustomOptions(props: {
  defaultValue: BoardConfig
  onConfirm: (b: BoardConfig) => void
}) {
  return (
    <>
      <Shadcn.DialogContent showCloseButton={false}>
        <Shadcn.DialogTitle>自定义</Shadcn.DialogTitle>
        <Shadcn.DialogFooter>
          <Shadcn.Button variant="outline">手气不错</Shadcn.Button>
          <Shadcn.DialogClose
            render={<Shadcn.Button onClick={() => {}}>确定</Shadcn.Button>}
          />
        </Shadcn.DialogFooter>
      </Shadcn.DialogContent>
    </>
  )
}
