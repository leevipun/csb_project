import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createServer, type Server } from "node:http";
import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { decode, encode } from "next-auth/jwt";

const db = new PrismaClient();
const fixes = new Set((process.env.FIXES ?? "").split(",").filter(Boolean));
const fixed = (id: number) => fixes.has(String(id));
const base = "http://127.0.0.1:3017";
const headers = { Origin: base, "Content-Type": "application/json" };
const injection = "') OR 1=1 -- ";
let consoleServer: Server;
let consoleUrl: string;
const secret = randomBytes(24).toString("hex");
const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
let attempts: { status: number; error: string | null }[] = [];
let auditReport = "";
async function attempt(
  api: APIRequestContext,
  email: string,
  password: string,
) {
  const { csrfToken } = await (await api.get("/api/auth/csrf")).json();
  return api.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: `${base}/dashboard`,
      json: "true",
    },
  });
}
async function login(api: APIRequestContext, who = "Alice") {
  const r = await attempt(
    api,
    `${who.toLowerCase()}@example.test`,
    `${who}Demo!2026`,
  );
  expect(r.status()).toBe(200);
  expect((await (await api.get("/api/auth/session")).json()).user.email).toBe(
    `${who.toLowerCase()}@example.test`,
  );
}
async function shot(page: Page, id: number) {
  // Capture each independent fixed variant and the baseline, not the combined run.
  if (fixes.size > 1 || (fixes.size === 1 && !fixed(id))) return;
  mkdirSync("screenshots", { recursive: true });
  await page.screenshot({
    path: `screenshots/flaw-${id}-${fixed(id) ? "after" : "before"}-1.png`,
    fullPage: true,
  });
}
test.beforeAll(async () => {
  // This ephemeral, token-protected loopback console is a TEST TOOL, not an app route.
  // Every displayed value is queried from PostgreSQL or returned by real HTTP calls.
  consoleServer = createServer(async (req, res) => {
    if (!req.url?.startsWith(`/${secret}/`)) {
      res.writeHead(404).end();
      return;
    }
    let output = "";
    const kind = req.url.split("/")[2];
    if (kind === "attempts")
      output =
        "$ POST /api/auth/callback/credentials — 7 bounded attempts, incorrect demo password\n\n" +
        attempts
          .map(
            (result, i) =>
              `Attempt ${i + 1}    HTTP ${result.status}    ${result.error}`,
          )
          .join("\n");
    else {
      const rows = await db.securityAuditEvent.findMany({
        orderBy: { id: "asc" },
      });
      output =
        '$ SELECT * FROM "SecurityAuditEvent" ORDER BY id;\n\n' +
        auditReport +
        "\n\n" +
        JSON.stringify(rows, null, 2);
    }
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'",
    });
    res.end(
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>NoteVault local verification console</title><style>body{background:#18201b;color:#e4eddf;font:16px/1.7 monospace;padding:48px;max-width:1200px}h1{font-size:24px}p{color:#b4c5af}pre{white-space:pre-wrap;overflow-wrap:anywhere;border-top:1px solid #53634d;padding-top:32px}</style><h1>NoteVault · local verification console</h1><p>Live PostgreSQL / HTTP results · fixes: ${escapeHtml(process.env.FIXES || "none (vulnerable)")}</p><p>Application: ${base} · Evidence path: ${escapeHtml(req.url)}</p><pre>${escapeHtml(output)}</pre></html>`,
    );
  });
  await new Promise<void>((resolve) =>
    consoleServer.listen(0, "127.0.0.1", resolve),
  );
  const address = consoleServer.address();
  if (!address || typeof address === "string")
    throw new Error("Console unavailable");
  consoleUrl = `http://127.0.0.1:${address.port}/${secret}`;
});
test.afterAll(async () => {
  await db.$disconnect();
  await new Promise<void>((resolve, reject) =>
    consoleServer.close((e) => (e ? reject(e) : resolve())),
  );
});

test("registration, authentication, encrypted sessions, CSRF, expiry and logout", async ({
  page,
  request,
}) => {
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Charlie");
  await page.getByLabel("Email address").fill("charlie@example.test");
  await page.getByLabel("Password", { exact: true }).fill("CharlieDemo!2026");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email address").fill("charlie@example.test");
  await page.getByLabel("Password", { exact: true }).fill("CharlieDemo!2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "next-auth.session-token",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.value.split(".")).toHaveLength(5);
  const token = await decode({
    token: cookie?.value,
    secret: process.env.NEXTAUTH_SECRET ?? "",
  });
  expect(token?.email).toBe("charlie@example.test");
  expect(token).not.toHaveProperty("password");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login/);
  expect(
    (await page.context().cookies()).some(
      (c) => c.name === "next-auth.session-token",
    ),
  ).toBe(false);
  expect(await (await page.request.get("/api/auth/session")).json()).toEqual(
    {},
  );
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  // NextAuth must reject forged login and logout submissions without its CSRF token.
  await request.post("/api/auth/callback/credentials", {
    form: {
      email: "alice@example.test",
      password: "AliceDemo!2026",
      json: "true",
    },
  });
  expect(await (await request.get("/api/auth/session")).json()).toEqual({});
  for (const [index, password] of ["a".repeat(73), "ä".repeat(37)].entries()) {
    const email = `long-${index}@example.test`;
    expect(
      (
        await request.post("/api/register", {
          headers,
          data: { name: "Long password", email, password },
        })
      ).status(),
    ).toBe(201);
    expect((await attempt(page.request, email, password)).status()).toBe(200);
  }
  // Route handlers reject malformed input directly, without an HTTP helper.
  for (const path of ["/api/register", "/api/notes"]) {
    for (const data of ["{", "null", "[]", "42"]) {
      const response = await request.post(path, { headers, data });
      expect(response.status()).toBe(path === "/api/register" ? 400 : 401);
    }
  }
  expect(
    (
      await request.post("/api/register", {
        headers: { ...headers, Origin: "https://example.test" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/register", {
        headers: { Origin: base, "Content-Type": "text/plain" },
        data: "{}",
      })
    ).status(),
  ).toBe(415);
  expect(
    (
      await request.post("/api/register", {
        headers,
        data: { email: "invalid", name: "Test", password: "ValidDemo!2026" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/register", {
        headers,
        data: {
          email: "alice@example.test",
          name: "Alice",
          password: "AliceDemo!2026",
        },
      })
    ).status(),
  ).toBe(409);
  await login(request);
  await request.post("/api/auth/signout", { form: { json: "true" } });
  expect((await request.get("/api/auth/session")).status()).toBe(200);
  const expired = await encode({
    secret: process.env.NEXTAUTH_SECRET ?? "",
    token: { sub: "1", name: "Alice", email: "alice@example.test" },
    maxAge: -120,
  });
  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: expired,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  expect(await (await page.request.get("/api/auth/session")).json()).toEqual(
    {},
  );
  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: "tampered-session",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  expect(await (await page.request.get("/api/auth/session")).json()).toEqual(
    {},
  );
  for (const data of ["{", "null", "[]", "42"]) {
    expect((await request.post("/api/notes", { headers, data })).status()).toBe(
      400,
    );
    expect(
      (await request.patch("/api/notes/1", { headers, data })).status(),
    ).toBe(400);
  }
  for (const data of [
    { title: 123, content: "text" },
    { title: "", content: "text" },
    { title: "x".repeat(201), content: "text" },
    { title: "Title" },
    { title: "Title", content: false },
    { title: "Title", content: "x".repeat(50001) },
  ]) {
    expect((await request.post("/api/notes", { headers, data })).status()).toBe(
      400,
    );
    expect(
      (await request.patch("/api/notes/1", { headers, data })).status(),
    ).toBe(400);
  }
  for (const path of ["/api/register", "/api/notes"]) {
    expect(
      (
        await request.post(path, {
          headers,
          data: { title: "Large", content: "ä".repeat(60000) },
        })
      ).status(),
    ).toBe(400);
  }
  expect(
    (
      await request.patch("/api/notes/1", {
        headers,
        data: { title: "Large", content: "ä".repeat(60000) },
      })
    ).status(),
  ).toBe(400);
  for (const id of ["not-a-number", "0", "-1", "1.5", "9007199254740992"]) {
    for (const method of ["GET", "PATCH", "DELETE"]) {
      const response = await request.fetch(`/api/notes/${id}`, {
        method,
        headers,
        data:
          method === "PATCH"
            ? { title: "Invalid ID", content: "text" }
            : undefined,
      });
      expect(response.status()).toBe(400);
    }
  }
  expect((await request.get(`/api/search?q=${"x".repeat(201)}`)).status()).toBe(
    400,
  );
  // Proxy guards application writes without intercepting reads or NextAuth.
  for (const { path, method } of [
    { path: "/api/register", method: "POST" },
    { path: "/api/notes", method: "POST" },
    { path: "/api/notes/1", method: "PATCH" },
    { path: "/api/notes/999999", method: "DELETE" },
  ]) {
    for (const origin of ["https://example.test", "null", undefined]) {
      const response = await request.fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(origin ? { Origin: origin } : {}),
        },
        data: { title: "Rejected", content: "Rejected" },
      });
      expect(response.status()).toBe(403);
    }
    const response = await request.fetch(path, {
      method,
      headers: { Origin: base, "Content-Type": "text/plain" },
      data: "{}",
    });
    expect(response.status()).toBe(method === "DELETE" ? 404 : 415);
  }
  expect((await request.get("/api/notes")).status()).toBe(200);
  expect((await request.get("/api/notes/1")).status()).toBe(200);
  expect(
    (
      await request.post("/api/register", {
        headers: {
          Origin: base,
          "Content-Type": "Application/JSON; charset=utf-8",
        },
        data: "{}",
      })
    ).status(),
  ).toBe(400);
  const me = await (await request.get("/api/auth/session")).json();
  expect(me.user.password).toBeUndefined();
  expect(
    (
      await request.post("/api/notes", { data: { title: "x", content: "x" } })
    ).status(),
  ).toBe(403);
});

test("browser CRUD and normal search, persisted rows and safe rendering", async ({
  page,
}) => {
  await login(page.request);
  await page.goto("/notes/new");
  await page.getByLabel("Title", { exact: true }).fill("A test page");
  await page
    .getByLabel("Your note")
    .fill(
      "Persistent observation with <script>alert(1)</script> as literal text.",
    );
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(
    page.getByRole("heading", { name: "A test page" }),
  ).toBeVisible();
  const id = Number(new URL(page.url()).pathname.split("/").pop());
  expect((await db.note.findUnique({ where: { id } }))?.content).toContain(
    "Persistent observation",
  );
  await page.getByRole("link", { name: "Edit note" }).click();
  await page.getByLabel("Title", { exact: true }).fill("An edited page");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(
    page.getByRole("heading", { name: "An edited page" }),
  ).toBeVisible();
  await page.goto("/search");
  await page.getByRole("textbox", { name: "Search notes" }).fill("edited");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("link", { name: /An edited page/ }).click();
  await page.getByRole("button", { name: "Delete note", exact: true }).click();
  await page.getByRole("button", { name: "Confirm deletion" }).click();
  await expect(page).toHaveURL(/\/notes$/);
  expect(await db.note.findUnique({ where: { id } })).toBeNull();
  await db.note.create({
    data: {
      title: "Restart persistence sentinel",
      content: "Survives a Next.js process restart.",
      userId: 1,
    },
  });
  if (!process.env.FIXES) {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Space to think." }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /A slower Saturday/ }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("FLAW 1 — Bob reads Alice's stored note; ownership fix rejects it", async ({
  page,
}) => {
  await login(page.request, "Bob");
  await page.goto("/notes/3");
  const response = await page.request.get("/api/notes/3");
  expect(response.status()).toBe(fixed(1) ? 404 : 200);
  if (fixed(1))
    await expect(
      page.getByRole("alert").filter({ hasText: "Note not found." }),
    ).toHaveText("Note not found.");
  else
    await expect(
      page.getByRole("heading", { name: "Alice's private field notes" }),
    ).toBeVisible();
  expect(
    (
      await page.request.patch("/api/notes/3", {
        headers,
        data: { title: "Denied", content: "Denied" },
      })
    ).status(),
  ).toBe(404);
  expect(
    (await page.request.delete("/api/notes/3", { headers, data: {} })).status(),
  ).toBe(404);
  await shot(page, 1);
  await login(page.request);
  expect((await page.request.get("/api/notes/3")).status()).toBe(200);
});

test("FLAW 2 — actual stored passwords and working credential verification", async ({
  page,
}) => {
  const user = await db.user.findUniqueOrThrow({
    where: { email: "alice@example.test" },
  });
  if (fixed(2)) expect(user.password).toMatch(/^\$2b\$12\$/);
  else expect(user.password).toBe("AliceDemo!2026");
  await login(page.request);
  await page.goto("http://127.0.0.1:5556");
  await page.getByText("User", { exact: true }).first().click();
  await expect(
    page.getByText("alice@example.test", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(user.password, { exact: true }).first(),
  ).toBeVisible();
  await shot(page, 2);
});

test("FLAW 3 — read-only SQL injection exposes Bob's notes; safe search blocks it", async ({
  page,
}) => {
  await login(page.request);
  await page.goto("/search");
  await page.getByRole("textbox", { name: "Search notes" }).fill(injection);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  if (fixed(3))
    await expect(
      page.getByRole("heading", { name: "No matching pages." }),
    ).toBeVisible();
  else
    await expect(
      page.getByRole("link", { name: /Bob's workshop checklist/ }),
    ).toBeVisible();
  const rows = (
    await (
      await page.request.get(`/api/search?q=${encodeURIComponent(injection)}`)
    ).json()
  ).notes;
  expect(rows.some((n: { userId: number }) => n.userId === 2)).toBe(!fixed(3));
  await shot(page, 3);
  const normal = (
    await (await page.request.get("/api/search?q=Saturday")).json()
  ).notes;
  expect(normal).toHaveLength(1);
  expect(normal[0].userId).toBe(1);
});

test("FLAW 4 — seven bounded attempts; library limit and real expiry", async ({
  page,
}) => {
  await login(page.request);
  attempts = [];
  for (let i = 0; i < 7; i++) {
    const response = await attempt(
      page.request,
      "alice@example.test",
      "IncorrectDemoOnly",
    );
    const data = await response.json();
    attempts.push({
      status: response.status(),
      error: new URL(data.url).searchParams.get("error"),
    });
  }
  expect(attempts.map((result) => result.status)).toEqual(Array(7).fill(401));
  expect(attempts.map((result) => result.error)).toEqual(
    fixed(4)
      ? [
          ...Array(5).fill("CredentialsSignin"),
          "TooManyAttempts",
          "TooManyAttempts",
        ]
      : Array(7).fill("CredentialsSignin"),
  );
  await page.goto(`${consoleUrl}/attempts`);
  await expect(page.locator("pre")).toContainText("Attempt 7");
  await shot(page, 4);
  if (fixed(4)) {
    const blocked = await attempt(
      page.request,
      "alice@example.test",
      "AliceDemo!2026",
    );
    expect(blocked.status()).toBe(401);
    expect(new URL((await blocked.json()).url).searchParams.get("error")).toBe(
      "TooManyAttempts",
    );
    // The normal NextAuth error also reaches the sign-in form.
    await page.goto("/login");
    await page.getByLabel("Email address").fill("alice@example.test");
    await page.getByLabel("Password", { exact: true }).fill("AliceDemo!2026");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Too many attempts." }),
    ).toHaveText("Too many attempts. Try again in 30 seconds.");
    await page.waitForTimeout(30500);
    await login(page.request);
    // A successful login resets the limiter: all five attempts are available again.
    for (let i = 0; i < 5; i++) {
      expect(
        (
          await attempt(page.request, "alice@example.test", "IncorrectDemoOnly")
        ).status(),
      ).toBe(401);
    }
    const concurrent = await Promise.all(
      Array.from({ length: 7 }, () =>
        attempt(page.request, "concurrent@example.test", "IncorrectDemoOnly"),
      ),
    );
    const errors = [];
    for (const response of concurrent) {
      expect(response.status()).toBe(401);
      errors.push(
        new URL((await response.json()).url).searchParams.get("error"),
      );
    }
    expect(errors.filter((error) => error === "TooManyAttempts")).toHaveLength(
      2,
    );
  }
});

test("FLAW 5 — omitted failed events versus actual safe audit entries", async ({
  page,
}) => {
  await db.securityAuditEvent.deleteMany();
  const response = await attempt(
    page.request,
    "bob@example.test",
    "IncorrectDemoOnly",
  );
  expect(response.status()).toBe(401);
  const events = await db.securityAuditEvent.findMany();
  expect(events).toHaveLength(fixed(5) ? 1 : 0);
  if (fixed(5)) {
    expect(events[0]).toMatchObject({
      eventType: "LOGIN_FAILED",
      account: "bob@example.test",
      method: "POST",
      requestPath: "/api/auth/callback/credentials",
      outcome: "DENIED",
    });
    expect(events[0].timestamp).toBeInstanceOf(Date);
  }
  expect(JSON.stringify(events)).not.toContain("IncorrectDemoOnly");
  auditReport = `Observed POST /api/auth/callback/credentials HTTP ${response.status()}\nFailed-login events recorded: ${events.length}`;
  await page.goto(`${consoleUrl}/audit`);
  await expect(page.locator("pre")).toContainText(auditReport);
  await shot(page, 5);
});
