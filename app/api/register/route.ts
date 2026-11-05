import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { registrationSchema } from "@/lib/validation";

// BEGIN FIX 2
// import bcrypt from "bcrypt";
// END FIX 2

export async function POST(req: Request) {
  try {
    const result = registrationSchema.safeParse(await req.json());
    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }
    const { email, password, name } = result.data;
    await db.user.create({
      data: {
        email,
        name,
        // FLAW 2: A02:2021 Cryptographic Failures. Plaintext password storage.
        // BEGIN VULNERABLE 2
        password,
        // END VULNERABLE 2
        // BEGIN FIX 2
        // password: await bcrypt.hash(password, 12),
        // END FIX 2
      },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON." }, { status: 400 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Account cannot be created with these details." },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "The request could not be completed." },
      { status: 500 },
    );
  }
}
