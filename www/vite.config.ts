import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { viteAlias } from '../alias'

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: viteAlias,
  },
})
