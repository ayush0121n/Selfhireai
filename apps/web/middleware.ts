import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://giwwacyiaqeqzelqamne.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_tqAiHDoulfMmlu_bvuuk8w_uJNP9z2g";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sessionCookie = request.cookies.get("selfhire_session")?.value;
  const isAuthenticated = Boolean(user || sessionCookie);

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/signup");
  
  const protectedPrefixes = [
    "/vault",
    "/jobs",
    "/resumes",
    "/resume",
    "/approvals",
    "/agent",
    "/sources",
    "/mcp",
    "/audit",
    "/account",
    "/policy",
    "/dashboard",
    "/auto-apply",
    "/career-insights",
    "/applications",
    "/matches",
    "/outreach",
    "/portals",
    "/settings",
    "/crm",
    "/saved-jobs",
    "/interviews",
    "/skills",
    "/onboarding",
    "/admin",
  ];

  const isProtectedPage = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  // If user is signed in and visits login/register, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If unauthenticated user attempts to visit protected route, redirect to login
  if (!isAuthenticated && isProtectedPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)",
  ],
};
