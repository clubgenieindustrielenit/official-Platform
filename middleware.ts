import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// NOTE: Next.js requires the export to be named exactly `middleware`.
// The previous name `proxy` caused this file to be silently ignored,
// meaning all route protection (login redirect, role checks) was never applied.
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
