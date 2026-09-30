import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 12005,
    // `host: true` exposait le serveur de dev sur toutes les interfaces réseau,
    // y compris depuis le LAN et via les tunnels de prévisualisation, sans
    // authentification ni HTTPS. On l'écoute uniquement sur la boucle locale.
    host: '127.0.0.1',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:12000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // Même restriction pour `vite preview`, souvent oublié.
    host: '127.0.0.1',
    port: 12006,
  },
  build: {
    rollupOptions: {
      output: {
        // Handled automatically by Vite
      },
    },
  },
})
