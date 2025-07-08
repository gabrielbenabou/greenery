import { isDevMode, mockSession, mockSuperAdmin } from "@/lib/dev-mode"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create Supabase client for Server Components
export async function createClient() {
    const cookieStore = await cookies()

    // In dev mode, return a mock client with superadmin user
    if (isDevMode) {
        return {
            auth: {
                getUser: () =>
                    Promise.resolve({
                        data: { user: mockSuperAdmin },
                        error: null,
                    }),
                getSession: () =>
                    Promise.resolve({
                        data: { session: mockSession },
                        error: null,
                    }),
            },
        }
    }

    if (!isSupabaseConfigured) {
        console.warn("Supabase environment variables are not set. Using dummy client.")
        return {
            auth: {
                getUser: () => Promise.resolve({ data: { user: null }, error: null }),
                getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            },
        }
    }

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
