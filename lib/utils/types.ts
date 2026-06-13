export type Direction = 'up' | 'down' | 'left' | 'right'
export type Position = { x: number; y: number }

export type Prettify<T> = { [K in keyof T]: T[K] } & {}
