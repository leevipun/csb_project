import type { Note } from "@prisma/client";
import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchQuerySchema } from "@/lib/validation";
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user)
      return Response.json({ error: "Please sign in." }, { status: 401 });
    const parsed = searchQuerySchema.safeParse(
      req.nextUrl.searchParams.get("q") ?? "",
    );
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const q = parsed.data;
    // FLAW 3: A03:2021 Injection. The database executes concatenated user input.
    // BEGIN VULNERABLE 3
    const notes = await db.$queryRawUnsafe<Note[]>(
      `SELECT * FROM "Note" WHERE "userId" = ${user.id} AND (title ILIKE '%${q}%' OR content ILIKE '%${q}%') ORDER BY "updatedAt" DESC`,
    );
    // END VULNERABLE 3
    // BEGIN FIX 3
    // const notes = await db.note.findMany({ where: { userId: user.id, OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }] }, orderBy: { updatedAt: "desc" } });
    // END FIX 3
    return Response.json({ notes });
  } catch {
    return Response.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
