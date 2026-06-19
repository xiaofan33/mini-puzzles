import configJson from './res/config.json'
import presetJson from './res/preset.json'

export type EmojiKey = keyof (typeof presetJson)['emojis']
export type Settings = (typeof configJson)['defaultSettings']

export interface ThemePreset {
  emojis: Record<EmojiKey, string>
  numberColors: Record<number, string>
  palettes: Record<string, string[]>
}

class ThemeLoader {
  private preset: ThemePreset
  private palettes: string[] = []

  constructor(preset: ThemePreset) {
    this.preset = preset
    this.palettes = Object.keys(preset.palettes) as string[]
  }

  getEmoji(key: EmojiKey) {
    return this.preset.emojis[key]
  }

  getNumberColor(key: number) {
    return this.preset.numberColors[key]
  }

  getPalette(key: string, isHighlighted?: boolean) {
    return this.preset.palettes[key][isHighlighted ? 1 : 0]
  }

  getRandomPalette(excluded?: string) {
    const palettes = this.palettes.filter(palette => palette !== excluded)
    return palettes[Math.floor(Math.random() * palettes.length)]
  }
}

export const themeLoader = new ThemeLoader(presetJson as ThemePreset)
