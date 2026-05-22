import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtected = createRouteMatcher([
  '/today(.*)',
  '/revision(.*)',
  '/progress(.*)',
  '/onboarding(.*)',
])

// auth is an object in clerkMiddleware — use auth.protect(), not auth().protect()
export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
