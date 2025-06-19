import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ],
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    // Enable source maps for easier debugging
    devSourcemap: true,
    modules: {
      // Only apply CSS modules to files that include .module. in their name
      localsConvention: 'camelCase',
      generateScopedName: mode === 'development' 
        ? '[name]__[local]__[hash:base64:5]'
        : '[hash:base64:5]'
    }
  },
  build: {
    // Ensure styles are extracted in production
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          const extType = assetInfo.name.split('.').at(1) || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
      },
    },
  }
}));
