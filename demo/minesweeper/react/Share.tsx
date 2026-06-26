import {} from 'react'
import { Shadcn } from '@/components/ui'
import type { GameProps } from '../model'

export default function Share(props: { onDump: () => GameProps }) {
  function onClickHandler() {
    const data = props.onDump()
    const url = new URL(location.href)
    url.hash = btoa(JSON.stringify(data))
    console.log(url.toString())
  }

  return (
    <>
      <Shadcn.Button variant="ghost" size="icon-lg" onClick={onClickHandler}>
        <i className="i-lucide-share-2 text-base" />
      </Shadcn.Button>
    </>
  )
}
