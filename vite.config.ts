// Custom config: build as a static SPA (target: vercel-static-like output in dist/)
// so the app can be deployed to Vercel without a server runtime.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    build: {
      outDir: "dist",
    },
  },
});
