import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: "/Easyride/", // Ensure correct base path for GitHub Pages
  plugins: [react()],
});
