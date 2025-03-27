import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Check if the environment is production
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://your-backend-url.com/api'
    ),
  },
  build: {
    minify: isProduction ? 'esbuild' : false,
    terserOptions: {
      compress: {
        drop_console: isProduction, // ✅ Remove all console logs in production
        drop_debugger: isProduction,
      },
    },
  },
});

