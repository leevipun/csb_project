import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { db } from "./db";
export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { id: true, name: true, email: true },
  });
}
