import BudgetManager from "@/components/budget-manager"
import ConsumptionDashboard from "@/components/consumption-dashboard"
import ConversionManager from "@/components/conversion-manager"
import MoodTracker from "@/components/mood-tracker"
import QuickTrack from "@/components/quick-track"
import RawProductsManager from "@/components/raw-products-manager"
import RecentEntries from "@/components/recent-entries"
import { ThemeToggle } from "@/components/theme-toggle"
import ToleranceTracker from "@/components/tolerance-tracker"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signOut } from "@/lib/actions"
import {
    getBudgetAlerts,
    getBudgetSettings,
    getConsumables,
    getConsumptionEntries,
    getConsumptionStats,
    getMoodCorrelations,
    getMoodTracking,
    getPendingMoodUpdates,
    getRawProducts,
    getToleranceTracking,
} from "@/lib/consumption-actions"
import { isDevMode } from "@/lib/dev-mode"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { BarChart3, Brain, DollarSign, Leaf, LogOut, Package, Target, Zap } from "lucide-react"
import { redirect } from "next/navigation"

export default async function Home() {
    // If Supabase is not configured and not in dev mode, show setup message
    if (!isSupabaseConfigured && !isDevMode) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <Leaf className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
                    <p className="text-muted-foreground">Configure your database to start using Greenery</p>
                </div>
            </div>
        )
    }

    // Get the user from the server
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If no user and not in dev mode, redirect to login
    if (!user && !isDevMode) {
        redirect("/auth/login")
    }

    // Fetch all data
    const { data: entries } = await getConsumptionEntries()
    const { data: statsData } = await getConsumptionStats()
    const { data: rawProducts } = await getRawProducts()
    const { data: consumables } = await getConsumables()
    const { data: toleranceData } = await getToleranceTracking()
    const { data: budgetSettings } = await getBudgetSettings()
    const { data: budgetAlerts } = await getBudgetAlerts()
    const { data: moodData } = await getMoodTracking()
    const { data: correlations } = await getMoodCorrelations()
    const { data: pendingMoodUpdates } = await getPendingMoodUpdates()

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                                <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-foreground">Greenery</h1>
                                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                    Welcome back, {user?.email?.split("@")[0] || "Developer"}
                                </p>
                                <p className="text-xs text-muted-foreground sm:hidden">
                                    {user?.email?.split("@")[0] || "Dev"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {isDevMode && (
                                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 dark:text-yellow-400 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                                    <span className="hidden sm:inline">🚧 DEV MODE</span>
                                    <span className="sm:hidden">🚧 DEV</span>
                                </div>
                            )}
                            <ThemeToggle />
                            {!isDevMode && (
                                <form action={signOut}>
                                    <Button variant="outline" size="sm" className="h-8 sm:h-9">
                                        <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Sign Out</span>
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="dashboard" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6 h-auto p-1">
                        <TabsTrigger value="dashboard" className="flex flex-col gap-1 h-auto py-2 px-1 sm:px-3">
                            <BarChart3 className="h-4 w-4" />
                            <span className="text-xs sm:text-sm hidden sm:block">Dashboard</span>
                            <span className="text-xs sm:hidden">Dash</span>
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="flex flex-col gap-1 h-auto py-2 px-1 sm:px-3">
                            <Package className="h-4 w-4" />
                            <span className="text-xs sm:text-sm hidden sm:block">Inventory</span>
                            <span className="text-xs sm:hidden">Inv</span>
                        </TabsTrigger>
                        <TabsTrigger value="mood" className="flex flex-col gap-1 h-auto py-2 px-1 sm:px-3">
                            <Brain className="h-4 w-4" />
                            <span className="text-xs sm:text-sm hidden sm:block">Mood</span>
                            <span className="text-xs sm:hidden">Mood</span>
                        </TabsTrigger>
                        <TabsTrigger value="tolerance" className="flex flex-col gap-1 h-auto py-2 px-1 sm:px-3">
                            <Target className="h-4 w-4" />
                            <span className="text-xs sm:text-sm hidden sm:block">Tolerance</span>
                            <span className="text-xs sm:hidden">Tol</span>
                        </TabsTrigger>
                        <TabsTrigger value="budget" className="flex flex-col gap-1 h-auto py-2 px-1 sm:px-3">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs sm:text-sm hidden sm:block">Budget</span>
                            <span className="text-xs sm:hidden">$$</span>
                        </TabsTrigger>
                        <TabsTrigger value="track" className="flex flex-col gap-1 h-auto py-2 px-1 sm:px-3">
                            <Zap className="h-4 w-4" />
                            <span className="text-xs sm:text-sm hidden sm:block">Quick Track</span>
                            <span className="text-xs sm:hidden">Track</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                            <div className="xl:col-span-3 space-y-6">
                                <ConsumptionDashboard
                                    entries={statsData || []}
                                    rawProducts={rawProducts || []}
                                    consumables={consumables || []}
                                />
                            </div>
                            <div className="xl:col-span-1 space-y-6">
                                <QuickTrack consumables={consumables || []} />
                                <RecentEntries entries={entries || []} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <RawProductsManager rawProducts={rawProducts || []} />
                            <ConversionManager rawProducts={rawProducts || []} consumables={consumables || []} />
                        </div>
                    </TabsContent>

                    <TabsContent value="mood" className="space-y-8">
                        <MoodTracker
                            moodData={moodData || []}
                            correlations={correlations || []}
                            pendingEntries={pendingMoodUpdates || []}
                        />
                    </TabsContent>

                    <TabsContent value="tolerance" className="space-y-8">
                        <ToleranceTracker toleranceData={toleranceData || []} />
                    </TabsContent>

                    <TabsContent value="budget" className="space-y-8">
                        <BudgetManager
                            budgetSettings={budgetSettings}
                            budgetAlerts={budgetAlerts || []}
                            rawProducts={rawProducts || []}
                        />
                    </TabsContent>

                    <TabsContent value="track" className="space-y-8">
                        <div className="max-w-md mx-auto">
                            <QuickTrack consumables={consumables || []} />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
