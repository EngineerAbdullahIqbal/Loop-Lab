import { defineConfig } from "vite";

// Workspace packages export raw .ts source; Vite/esbuild transpile them, but
// they must not be pre-bundled as opaque deps. Keeping them out of optimizeDeps
// lets Vite process them as part of the module graph.
export default defineConfig({
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
