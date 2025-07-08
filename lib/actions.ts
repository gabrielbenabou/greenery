"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Helper function to create Supabase client for server actions
async function createSupabaseServerActionClient() {
    const cookieStore = await cookies()

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
                        // The `setAll` method was called from a Server Action.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

// Update the signIn function to handle redirects properly
export async function signIn(prevState: any, formData: FormData) {
    // Check if formData is valid
    if (!formData) {
        return { error: "Form data is missing" }
    }

    const email = formData.get("email")
    const password = formData.get("password")

    // Validate required fields
    if (!email || !password) {
        return { error: "Email and password are required" }
    }

    const supabase = await createSupabaseServerActionClient()

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.toString(),
            password: password.toString(),
        })

        if (error) {
            return { error: error.message }
        }

        // Return success instead of redirecting directly
        return { success: true }
    } catch (error) {
        console.error("Login error:", error)
        return { error: "An unexpected error occurred. Please try again." }
    }
}

// Update the signUp function to handle potential null formData
export async function signUp(prevState: any, formData: FormData) {
    // Check if formData is valid
    if (!formData) {
        return { error: "Form data is missing" }
    }

    const email = formData.get("email")
    const password = formData.get("password")

    // Validate required fields
    if (!email || !password) {
        return { error: "Email and password are required" }
    }

    const supabase = await createSupabaseServerActionClient()

    try {
        const { error } = await supabase.auth.signUp({
            email: email.toString(),
            password: password.toString(),
        })

        if (error) {
            return { error: error.message }
        }

        return { success: "Check your email to confirm your account." }
    } catch (error) {
        console.error("Sign up error:", error)
        return { error: "An unexpected error occurred. Please try again." }
    }
}

export async function signOut() {
    const supabase = await createSupabaseServerActionClient()

    await supabase.auth.signOut()
    redirect("/auth/login")
}
