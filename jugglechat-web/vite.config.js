import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx';
import legacy from '@vitejs/plugin-legacy';
import Icons from 'unplugin-icons/vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueJsx(),
    legacy(),
    Icons({
      compiler: 'vue3',
      autoInstall: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'vue-demi'],
          'juggleim-sdk': ['./src/libs/juggleim-es-1.8.0.js'],
          'markdown': ['markdown-it'],
          'media-utils': ['html2canvas', 'qrcode', 'qiniu-js', 'v-viewer'],
          'virtual-scroller': ['vue-virtual-scroller'],
        }
      }
    }
  }
})
