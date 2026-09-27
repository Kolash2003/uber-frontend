import { NextResponse, type NextRequest } from "next/server";

const RIDER_PREFIXES = ["/home", "/book", "/trips", "/profile", "/payment-methods", "/trip"];
const DRIVER_PREFIXES = ["/driver"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("uber-ride-role")?.value;
  const sessionToken = request.cookies
    .getAll()
    .some(
      ({ name }) =>
        name === "better-auth.session_token" ||
        name === "__Secure-better-auth.session_token" ||
        name.startsWith("better-auth.session_token.") ||
        name.startsWith("__Secure-better-auth.session_token.")
    );

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isRiderPath = RIDER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isDriverPath = DRIVER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isAuthPage && sessionToken && role) {
    return NextResponse.redirect(
      new URL(role === "driver" ? "/driver/dashboard" : "/home", request.url)
    );
  }

  if (isRiderPath) {
    if (!sessionToken) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (role === "driver") {
      return NextResponse.redirect(new URL("/driver/dashboard", request.url));
    }
  }

  if (isDriverPath) {
    if (!sessionToken) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      url.searchParams.set("role", "driver");
      return NextResponse.redirect(url);
    }
    if (role === "rider") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:png|jpg|jpeg|svg|gif|webp)).*)",
  ],
};
