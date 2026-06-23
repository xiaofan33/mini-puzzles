import { userSettings } from './assets/config.json'
import presetJson from './assets/preset.json'

export type EmojiKey = keyof typeof presetJson.emojis
export type Settings = typeof userSettings & {}

export interface ThemePreset {
  emojis: Record<EmojiKey, string>
  numberColors: Record<string, string>
  palettes: Record<string, string[]>
}

class ThemeLoader {
  private preset: ThemePreset
  private paletteKeys: string[]

  constructor(preset: ThemePreset) {
    this.preset = preset
    this.paletteKeys = Object.keys(preset.palettes)
  }

  getEmoji(key: EmojiKey) {
    return this.preset.emojis[key]
  }

  getNumberColor(num: string) {
    return this.preset.numberColors[num]
  }

  getStyleClass(key: string, isHighlighted = false) {
    const index = isHighlighted ? 1 : 0
    return this.preset.palettes[key][index]
  }

  getRandomPaletteKey(excluded?: string) {
    const available = this.paletteKeys.filter(key => key !== excluded)
    const pickIndex = Math.floor(Math.random() * available.length)
    return available[pickIndex]
  }
}

export const themeLoader = new ThemeLoader(presetJson)
