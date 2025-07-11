import LoginForm from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { isDevMode } from "@/lib/dev-mode"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage() {
    // In dev mode, redirect to home page
    if (isDevMode) {
        redirect("/")
    }

    // If Supabase is not configured, show setup message directly
    if (!isSupabaseConfigured) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
                    <p className="text-muted-foreground">Configure your database to start using Greenery</p>
                </div>
            </div>
        )
    }

    // Check if user is already logged in
    const supabase = await createClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()

    // If user is logged in, redirect to home page
    if (session) {
        redirect("/")
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <LoginForm />
        </div>
    )
}
