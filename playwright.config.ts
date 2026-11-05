import { defineConfig } from "@playwright/test";

process.loadEnvFile(".env");
export default defineConfig({
  testDir: "./tests",
  testMatch: process.env.VERIFY_RESTART
    ? "persistence.spec.ts"
    : "course.spec.ts",
  webServer: [
    {
      command: "npm run start -- --port 3017",
      url: "http://127.0.0.1:3017/api/auth/session",
      env: { NOTEVAULT_TEST: "1", NEXTAUTH_URL: "http://127.0.0.1:3017" },
      reuseExistingServer: false,
    },
    {
      command: "npm run db:studio -- --port 5556",
      url: "http://127.0.0.1:5556",
      reuseExistingServer: false,
    },
  ],
  timeout: 90000,
  workers: 1,
  fullyParallel: false,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: `.verification/results-${process.env.VERIFY_RESTART ? "restart" : process.env.FIXES || "vulnerable"}.json`,
      },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:3017",
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    trace: "retain-on-failure",
  },
});
