
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ここに自分のリポジトリ名を入れる（前後にスラッシュ必須）
  base: '/react-todo-app/', 
})

