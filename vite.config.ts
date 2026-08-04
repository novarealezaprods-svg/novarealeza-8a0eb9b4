import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        // Separa as dependências que quase nunca mudam do código do site.
        // Assim um deploy novo não invalida o cache do React/Supabase, e o
        // navegador baixa os pedaços em paralelo.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Só o que é grande E compartilhado entre rotas ganha chunk próprio.
          // O resto fica sem regra de propósito: assim libs usadas apenas por
          // um chunk lazy (embla, radix-dialog) são baixadas junto com ele, e
          // não no carregamento inicial.
          if (id.includes("@supabase")) return "supabase";
          if (
            id.includes("react-router") ||
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("/scheduler/")
          ) {
            return "react";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
});
