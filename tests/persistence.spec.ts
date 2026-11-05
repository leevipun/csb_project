import { expect, test } from "@playwright/test";

test("notes persist after a server restart", async ({ request }) => {
  const { csrfToken } = await (await request.get("/api/auth/csrf")).json();
  const response = await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email: "alice@example.test",
      password: "AliceDemo!2026",
      json: "true",
    },
  });
  expect(response.ok()).toBe(true);
  const { notes } = await (await request.get("/api/notes")).json();
  expect(notes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ title: "Restart persistence sentinel" }),
    ]),
  );
});
