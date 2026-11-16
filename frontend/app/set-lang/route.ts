import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") === "en" ? "en" : "bn";
  const returnTo = searchParams.get("returnTo");

  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https://") ? "https" : "http");
  const isHttps = proto === "https";

  if (returnTo) {
    const safeReturn = (returnTo.startsWith("/") && !returnTo.startsWith("//")) ? returnTo : "/";
    const response = new NextResponse(null, {
      status: 307,
      headers: {
        Location: safeReturn,
      },
    });
    response.cookies.set("NEXT_LOCALE", to, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
      secure: isHttps,
    });
    return response;
  }

  const response = NextResponse.json({ success: true, locale: to });
  response.cookies.set("NEXT_LOCALE", to, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
    secure: isHttps,
  });
  return response;
}
