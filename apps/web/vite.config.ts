import { defineConfig } from "vite";

// Workspace packages export raw .ts source; Vite/esbuild transpile them, but
// they must not be pre-bundled as opaque deps. Keeping them out of optimizeDeps
// lets Vite process them as part of the module graph.
export default defineConfig({
  // Relative asset paths so the built site works both locally and when served
  // from a subpath (e.g. GitHub Pages: https://<user>.github.io/Loop-Lab/).
  // The app routes with hashes (#/guide, #/deck), so no server rewrites needed.
  base: "./",
  optimizeDeps: {
    exclude: [
      "@loop-lab/loop-core",
      "@loop-lab/verifiers",
      "@loop-lab/lessons",
      "@loop-lab/strings",
    ],
  },
  server: { fs: { allow: [".."] } },
});
