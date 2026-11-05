import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return NextResponse.next();
  }

  const expectedOrigin = new URL(process.env.NEXTAUTH_URL ?? request.url)
    .origin;
  if (request.headers.get("origin") !== expectedOrigin) {
    return NextResponse.json(
      { error: "Request origin rejected." },
      { status: 403 },
    );
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (request.method !== "DELETE" && contentType !== "application/json") {
    return NextResponse.json({ error: "Use JSON." }, { status: 415 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/register", "/api/notes/:path*"],
};
