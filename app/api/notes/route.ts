import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { noteSchema } from "@/lib/validation";
export async function GET() {
  try {
    const user = await currentUser();
    if (!user)
      return Response.json({ error: "Please sign in." }, { status: 401 });
    return Response.json({
      notes: await db.note.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      }),
    });
  } catch {
    return Response.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user)
      return Response.json({ error: "Please sign in." }, { status: 401 });
    const parsed = noteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { title, content } = parsed.data;
    const note = await db.note.create({
      data: { title, content, userId: user.id },
    });
    return Response.json({ note }, { status: 201 });
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
