import { isDevMode } from "@/lib/dev-mode"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request: NextRequest) {
    // In dev mode, skip all auth checks
    if (isDevMode) {
        return NextResponse.next({
            request,
        })
    }

    // If Supabase is not configured, just continue without auth
    if (!isSupabaseConfigured) {
        return NextResponse.next({
            request,
        })
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Check if this is an auth callback
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (code) {
        // Exchange the code for a session
        await supabase.auth.exchangeCodeForSession(code)
        // Redirect to home page after successful auth
        return NextResponse.redirect(new URL("/", request.url))
    }

    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession()

    // Protected routes - redirect to login if not authenticated
    const isAuthRoute =
        request.nextUrl.pathname.startsWith("/auth/login") ||
        request.nextUrl.pathname.startsWith("/auth/sign-up") ||
        request.nextUrl.pathname === "/auth/callback"

    if (!isAuthRoute) {
        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            const redirectUrl = new URL("/auth/login", request.url)
            return NextResponse.redirect(redirectUrl)
        }
    }

    return supabaseResponse
}
