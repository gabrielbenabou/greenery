import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import type React from "react"
import { Toaster } from "sonner"
import "./globals.css"

const geist = Geist({
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Greenery - Cannabis Consumption Tracker",
    description: "A comprehensive cannabis consumption tracking and analytics platform",
    generator: 'v0.dev'
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={geist.className}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
}
