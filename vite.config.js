import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Change this to your repository name if deploying to GitHub Pages (e.g., '/Easyride/')
});
