import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";

export const fixFiles = [
  "lib/auth-options.ts",
  "app/api/register/route.ts",
  "prisma/seed.ts",
  "app/api/notes/[id]/route.ts",
  "app/api/search/route.ts",
];
const backup = ".fix-backup.json";
export function restore() {
  if (!existsSync(backup)) return;
  for (const [path, text] of Object.entries(
    JSON.parse(readFileSync(backup, "utf8")),
  ))
    writeFileSync(path, text);
  unlinkSync(backup);
}
export function activate(ids) {
  if (existsSync(backup))
    throw new Error(
      "Restore the previous fixes first: node tests/fixes.mjs restore",
    );
  if (!ids.length || ids.some((id) => !/^[1-5]$/.test(id)))
    throw new Error("Choose fixes 1–5, e.g. node tests/fixes.mjs 1 3");
  const originals = Object.fromEntries(
    fixFiles.map((path) => [path, readFileSync(path, "utf8")]),
  );
  writeFileSync(backup, JSON.stringify(originals));
  for (const [path, original] of Object.entries(originals)) {
    let text = original;
    for (const id of ids) {
      text = text.replace(
        new RegExp(
          `(^[ \t]*// BEGIN VULNERABLE ${id}\n)([\\s\\S]*?)(^[ \t]*// END VULNERABLE ${id})`,
          "gm",
        ),
        (_, a, _body, z) => a + z,
      );
      text = text.replace(
        new RegExp(
          `(^[ \t]*// BEGIN FIX ${id}\n)([\\s\\S]*?)(^[ \t]*// END FIX ${id})`,
          "gm",
        ),
        (_, a, body, z) => a + body.replace(/^([ \t]*)\/\/ ?/gm, "$1") + z,
      );
    }
    writeFileSync(path, text);
  }
}
if (process.argv[1]?.endsWith("fixes.mjs")) {
  const ids = process.argv.slice(2);
  if (ids[0] === "restore") restore();
  else activate(ids);
}
