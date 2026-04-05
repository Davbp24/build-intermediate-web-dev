import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const DEFAULT_WORKSPACE_ID = 'ws-1'

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

/**
 * Folder ids are `folder-{ts}`; document ids are `doc-{ts}-…`.
 * Mis-typed URLs like /app/:ws/folder/doc-123-abc (doc id in folder slot) → canonical doc route.
 */
function redirectFolderSegmentIsDocId(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const m = pathname.match(/^\/app\/([^/]+)\/folder\/(doc-\d+[^/]*)$/i)
  if (!m) return null
  const url = request.nextUrl.clone()
  url.pathname = `/app/${m[1]}/doc/${m[2]}`
  return NextResponse.redirect(url)
}

/** Root /doc-… (broken relative link from /) → default workspace doc route. */
function redirectRootDocId(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const m = pathname.match(/^\/(doc-\d+[^/]*)$/i)
  if (!m) return null
  const url = request.nextUrl.clone()
  url.pathname = `/app/${DEFAULT_WORKSPACE_ID}/doc/${m[1]}`
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const fixed =
    redirectFolderSegmentIsDocId(request) ??
    redirectLegacyFlatDocUrl(request) ??
    redirectRootDocId(request)
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
