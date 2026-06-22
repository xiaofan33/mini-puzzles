export type Direction = 'up' | 'down' | 'left' | 'right'
export type Position = { x: number; y: number }
export type Rect = { w: number; h: number }

export type Prettify<T> = { [K in keyof T]: T[K] } & {}
