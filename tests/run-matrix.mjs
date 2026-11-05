import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { activate, fixFiles, restore } from "./fixes.mjs";

process.loadEnvFile(".env");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
mkdirSync(".verification", { recursive: true });
const summary = [];
function run(args, env = {}) {
  const r = spawnSync(npm, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  if (r.status !== 0)
    throw new Error(`npm ${args.join(" ")} failed (${r.status})`);
}
process.on("SIGINT", () => {
  restore();
  process.exit(130);
});
try {
  restore();
  for (const ids of [
    [],
    ["1"],
    ["2"],
    ["3"],
    ["4"],
    ["5"],
    ["1", "2", "3", "4", "5"],
  ]) {
    const label = ids.join(",") || "vulnerable";
    console.log(`\nVERIFY VARIANT: ${label}`);
    if (ids.length) activate(ids);
    run(["run", "db:seed"]);
    run(["run", "build"], {
      NOTEVAULT_TEST: "1",
      NEXTAUTH_URL: "http://127.0.0.1:3017",
    });
    run(["run", "test:e2e"], { FIXES: ids.join(",") });
    if (!ids.length) {
      // Playwright stopped the first server; this run starts a fresh process.
      run(["run", "test:e2e"], { VERIFY_RESTART: "1" });
      summary.push("Persistence across actual server restart: PASS");
    }
    summary.push(`${label}: 7 Playwright tests PASS`);
    restore();
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  restore();
  run(["run", "db:seed"]);
  writeFileSync(".verification/summary.txt", summary.join("\n") + "\n");
  console.log(summary.join("\n"));
  if (process.exitCode !== 1) {
    for (const path of fixFiles) {
      const text = readFileSync(path, "utf8");
      for (const [, body] of text.matchAll(
        /BEGIN FIX \d\n([\s\S]*?)^[ \t]*\/\/ END FIX/gm,
      ))
        if (
          body
            .split("\n")
            .some((line) => line.trim() && !line.trim().startsWith("//"))
        ) {
          console.error(`Uncommented fix in ${path}`);
          process.exitCode = 1;
        }
    }
    console.log(
      "Final source: vulnerable blocks active, secure blocks commented. Demo database reset.",
    );
  }
}
