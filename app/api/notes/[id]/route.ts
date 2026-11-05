import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { noteIdSchema, noteSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  context: RouteContext<"/api/notes/[id]">,
) {
  try {
    const user = await currentUser();
    if (!user)
      return Response.json({ error: "Please sign in." }, { status: 401 });
    const parsedId = noteIdSchema.safeParse((await context.params).id);
    if (!parsedId.success)
      return Response.json({ error: "Invalid note ID." }, { status: 400 });
    const id = parsedId.data;
    // FLAW 1: A01:2021 Broken Access Control. Missing ownership check.
    // BEGIN VULNERABLE 1
    const note = await db.note.findUnique({ where: { id } });
    // END VULNERABLE 1
    // BEGIN FIX 1
    // const note = await db.note.findFirst({ where: { id, userId: user.id } });
    // END FIX 1
    if (!note)
      return Response.json({ error: "Note not found." }, { status: 404 });
    return Response.json({ note });
  } catch {
    return Response.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
export async function PATCH(
  req: Request,
  context: RouteContext<"/api/notes/[id]">,
) {
  try {
    const user = await currentUser();
    if (!user)
      return Response.json({ error: "Please sign in." }, { status: 401 });
    const parsedId = noteIdSchema.safeParse((await context.params).id);
    if (!parsedId.success)
      return Response.json({ error: "Invalid note ID." }, { status: 400 });
    const id = parsedId.data;
    const parsed = noteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { title, content } = parsed.data;
    const result = await db.note.updateMany({
      where: { id, userId: user.id },
      data: { title, content },
    });
    if (!result.count)
      return Response.json({ error: "Note not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON." }, { status: 400 });
    }
    return Response.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
export async function DELETE(
  _req: Request,
  context: RouteContext<"/api/notes/[id]">,
) {
  try {
    const user = await currentUser();
    if (!user)
      return Response.json({ error: "Please sign in." }, { status: 401 });
    const parsedId = noteIdSchema.safeParse((await context.params).id);
    if (!parsedId.success)
      return Response.json({ error: "Invalid note ID." }, { status: 400 });
    const id = parsedId.data;
    const result = await db.note.deleteMany({ where: { id, userId: user.id } });
    if (!result.count)
      return Response.json({ error: "Note not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
