import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"
import { isDevMode, mockSuperAdmin, mockSession } from "@/lib/dev-mode"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a cached version of the Supabase client for Server Components
export const createClient = cache(() => {
  const cookieStore = cookies()

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

  return createServerComponentClient({ cookies: () => cookieStore })
})
