import { db } from "../lib/db";

// BEGIN FIX 2
// import bcrypt from "bcrypt";
// END FIX 2

async function main() {
  await db.securityAuditEvent.deleteMany();
  await db.note.deleteMany();
  await db.user.deleteMany();
  for (const [id, name] of [
    [1, "Alice"],
    [2, "Bob"],
  ] as const) {
    await db.user.create({
      data: {
        id,
        name,
        email: `${name.toLowerCase()}@example.test`,
        // BEGIN VULNERABLE 2
        password: `${name}Demo!2026`,
        // END VULNERABLE 2
        // BEGIN FIX 2
        // password: await bcrypt.hash(`${name}Demo!2026`, 12),
        // END FIX 2
      },
    });
  }
  const notes = [
    {
      id: 1,
      userId: 1,
      title: "A slower Saturday",
      content:
        "Walk by the harbour. Pick up a loaf of rye bread. Leave the afternoon open for a good book.",
    },
    {
      id: 2,
      userId: 1,
      title: "Ideas worth keeping",
      content:
        "A small reading room with a shared shelf. A notebook for observations. A monthly dinner with old friends.",
    },
    {
      id: 3,
      userId: 1,
      title: "Alice's private field notes",
      content:
        "Fictional research: the blue greenhouse opens at nine. Bring the sample notebook. For Alice only.",
    },
    {
      id: 4,
      userId: 2,
      title: "Bob's workshop checklist",
      content:
        "Sharpen pencils, clear the workbench, and measure twice before cutting.",
    },
    {
      id: 5,
      userId: 2,
      title: "Books for November",
      content:
        "Finish the history of navigation. Find a collection of short stories for the train.",
    },
  ];
  for (const note of notes) await db.note.create({ data: note });
  await db.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), 2)`;
  await db.$executeRaw`SELECT setval(pg_get_serial_sequence('"Note"', 'id'), 5)`;
  console.log("Seeded Alice and Bob with five fictional notes.");
}
main().finally(() => db.$disconnect());
