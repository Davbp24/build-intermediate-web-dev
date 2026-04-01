import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Fix 404s when the URL is /app/:ws/doc-123-abc instead of /app/:ws/doc/doc-123-abc
 * (e.g. relative links or stale bookmarks missing the /doc/ segment).
 */
function redirectLegacyFlatDocUrl(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const m = pathname.match(/^\/app\/([^/]+)\/(doc-\d+[^/]*)$/i)
  if (!m) return null
  const url = request.nextUrl.clone()
  url.pathname = `/app/${m[1]}/doc/${m[2]}`
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const fixed = redirectLegacyFlatDocUrl(request)
  if (fixed) return fixed

  // Only run auth checks when Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next()
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
