import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the access token from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value || 
                     request.cookies.get('supabase-auth-token')?.value;
  
  // Check for any supabase session cookies
  const hasSupabaseSession = Array.from(request.cookies.getAll()).some(cookie => 
    cookie.name.includes('supabase') || cookie.name.includes('sb-')
  );

  const { pathname } = request.nextUrl;
  
  // Allow access to auth pages and public routes
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // If no session detected and trying to access protected routes, redirect to login
  if (!hasSupabaseSession && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
