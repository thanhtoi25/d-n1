import path from "path";
import { defineConfig } from "vitest/config";
import { testDbUrl } from "./tests/db-url";

const url = testDbUrl();

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
    env: { DATABASE_URL: url, TEST_DATABASE_URL: url, STORAGE_DIR: path.resolve(__dirname, "storage/test-uploads"), NODE_ENV: "test" },
    testTimeout: 30000,
  },
});
