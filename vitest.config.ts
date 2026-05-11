import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    pool: "threads",
    include: ["tests/**/*.test.ts", "tests/**/*.test.js"],
    server: {
      deps: {
        inline: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**"],
      exclude: ["src/**/*.test.*", "main.js"],
    },
  },
  resolve: {
    extensions: [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json"],
    alias: {
      obsidian: path.resolve(__dirname, "tests/__mocks__/obsidian.ts"),
      "@core": path.resolve(__dirname, "src/core"),
      "@domain": path.resolve(__dirname, "src/domain"),
      "@io": path.resolve(__dirname, "src/io"),
      "@ui": path.resolve(__dirname, "src/ui"),
    },
  },
});
