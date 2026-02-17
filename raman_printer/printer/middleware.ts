import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookies
  const sessionToken = request.cookies.get('authjs.session-token')?.value || 
                       request.cookies.get('__Secure-authjs.session-token')?.value;
  
  const isLoggedIn = !!sessionToken;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/signup'],
};
