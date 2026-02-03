import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookies
  const sessionToken = request.cookies.get('authjs.session-token')?.value || 
                       request.cookies.get('__Secure-authjs.session-token')?.value;
  
  const isLoggedIn = !!sessionToken;

  // For protected routes, check if user is deleted
  if (isLoggedIn && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    try {
      const session = await auth();
      // If session exists but user is not found (deleted), force logout
      if (!session?.user) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('authjs.session-token');
        response.cookies.delete('__Secure-authjs.session-token');
        return response;
      }
    } catch (error) {
      // Session invalid, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect admin routes - need to check role from session
  // For now, just check if logged in (role check will be done server-side)
  if (pathname.startsWith('/admin') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
