// vite.config.ts
import { defineConfig } from "file:///D:/legalAI/node_modules/vite/dist/node/index.js";
import react from "file:///D:/legalAI/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///D:/legalAI/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\legalAI";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ],
  optimizeDeps: {
    include: ["pdfjs-dist"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  css: {
    // Enable source maps for easier debugging
    devSourcemap: true,
    modules: {
      // Only apply CSS modules to files that include .module. in their name
      localsConvention: "camelCase",
      generateScopedName: mode === "development" ? "[name]__[local]__[hash:base64:5]" : "[hash:base64:5]"
    }
  },
  build: {
    // Ensure styles are extracted in production
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return "assets/[name]-[hash][extname]";
          const extType = assetInfo.name.split(".").at(1) || "";
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        }
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxsZWdhbEFJXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxsZWdhbEFJXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9sZWdhbEFJL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSAndml0ZS1wbHVnaW4tc3RhdGljLWNvcHknO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiOjpcIixcclxuICAgIHBvcnQ6IDgwODAsXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJiBjb21wb25lbnRUYWdnZXIoKSxcclxuICBdLFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogWydwZGZqcy1kaXN0J11cclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGNzczoge1xyXG4gICAgLy8gRW5hYmxlIHNvdXJjZSBtYXBzIGZvciBlYXNpZXIgZGVidWdnaW5nXHJcbiAgICBkZXZTb3VyY2VtYXA6IHRydWUsXHJcbiAgICBtb2R1bGVzOiB7XHJcbiAgICAgIC8vIE9ubHkgYXBwbHkgQ1NTIG1vZHVsZXMgdG8gZmlsZXMgdGhhdCBpbmNsdWRlIC5tb2R1bGUuIGluIHRoZWlyIG5hbWVcclxuICAgICAgbG9jYWxzQ29udmVudGlvbjogJ2NhbWVsQ2FzZScsXHJcbiAgICAgIGdlbmVyYXRlU2NvcGVkTmFtZTogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyBcclxuICAgICAgICA/ICdbbmFtZV1fX1tsb2NhbF1fX1toYXNoOmJhc2U2NDo1XSdcclxuICAgICAgICA6ICdbaGFzaDpiYXNlNjQ6NV0nXHJcbiAgICB9XHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gRW5zdXJlIHN0eWxlcyBhcmUgZXh0cmFjdGVkIGluIHByb2R1Y3Rpb25cclxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcclxuICAgICAgICAgIGlmICghYXNzZXRJbmZvLm5hbWUpIHJldHVybiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nO1xyXG4gICAgICAgICAgY29uc3QgZXh0VHlwZSA9IGFzc2V0SW5mby5uYW1lLnNwbGl0KCcuJykuYXQoMSkgfHwgJyc7XHJcbiAgICAgICAgICBpZiAoL3BuZ3xqcGU/Z3xzdmd8Z2lmfHRpZmZ8Ym1wfGljby9pLnRlc3QoZXh0VHlwZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBhc3NldHMvaW1nL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGBhc3NldHMvJHtleHRUeXBlfS9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9XHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvTixTQUFTLG9CQUFvQjtBQUNqUCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQzVDO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsWUFBWTtBQUFBLEVBQ3hCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxLQUFLO0FBQUE7QUFBQSxJQUVILGNBQWM7QUFBQSxJQUNkLFNBQVM7QUFBQTtBQUFBLE1BRVAsa0JBQWtCO0FBQUEsTUFDbEIsb0JBQW9CLFNBQVMsZ0JBQ3pCLHFDQUNBO0FBQUEsSUFDTjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsY0FBYztBQUFBLElBQ2QsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCLENBQUMsY0FBYztBQUM3QixjQUFJLENBQUMsVUFBVSxLQUFNLFFBQU87QUFDNUIsZ0JBQU0sVUFBVSxVQUFVLEtBQUssTUFBTSxHQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUs7QUFDbkQsY0FBSSxrQ0FBa0MsS0FBSyxPQUFPLEdBQUc7QUFDbkQsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU8sVUFBVSxPQUFPO0FBQUEsUUFDMUI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
