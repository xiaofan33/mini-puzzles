import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Alias } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export function r(path: string, base = root) {
  return resolve(base, path).replace(/\\/g, '/')
}

function createSubDirAliases(dir: string, prefix = '@') {
  if (!existsSync(dir)) {
    return []
  }

  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(({ name }) => ({
        find: `${prefix}/${name}`,
        replacement: `${dir}/${name}`,
      }))
  } catch (error) {
    console.error(`[alias] Error while reading directory "${dir}":`, error)
  }
  return []
}

export const ROOT_DIR = r('')
export const DEMO_DIR = r('demo')
export const SRC_DIR = r('src')

export const viteAliases: readonly Alias[] = [
  ...createSubDirAliases(DEMO_DIR),
  { find: /^@\//, replacement: `${SRC_DIR}/` },
]
