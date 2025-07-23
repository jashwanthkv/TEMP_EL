import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";


const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVHCcjjfTzT2fDyU9oXgKTFcSCBO_Wj6whJu0F5zua4xe1dQzCcGQxBVJHSqzyqP_YxA/exec";

export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
    proxy: {
      "/script-api": {
        target: APPS_SCRIPT_URL,
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/script-api/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            // Google Apps Script expects POSTs to have the correct content-type
            if (req.method === "POST" && !proxyReq.getHeader("Content-Type")) {
              proxyReq.setHeader("Content-Type", "application/json");
            }
          });
        },
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
