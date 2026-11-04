import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Относительные пути, чтобы сборка открывалась и из подпапки (например, на GitHub Pages)
  base: './',
  plugins: [react()],
});
