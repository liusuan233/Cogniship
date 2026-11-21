import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite' // 引入

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // 添加插件
],
})
