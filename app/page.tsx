import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Leaf } from "lucide-react"
import { signOut } from "@/lib/actions"
import { isDevMode } from "@/lib/dev-mode"
import { ThemeToggle } from "@/components/theme-toggle"
import QuickTrack from "@/components/quick-track"
import ConsumptionDashboard from "@/components/consumption-dashboard"
import RecentEntries from "@/components/recent-entries"
import RawProductsManager from "@/components/raw-products-manager"
import ConversionManager from "@/components/conversion-manager"
import ToleranceTracker from "@/components/tolerance-tracker"
import BudgetManager from "@/components/budget-manager"
import {
  getConsumptionEntries,
  getConsumptionStats,
  getRawProducts,
  getConsumables,
  getToleranceTracking,
  getBudgetSettings,
  getBudgetAlerts,
  getMoodTracking,
  getMoodCorrelations,
  getPendingMoodUpdates,
} from "@/lib/consumption-actions"
import MoodTracker from "@/components/mood-tracker"

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
  const supabase = createClient()
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Greenery</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.email?.split("@")[0] || "Developer"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isDevMode && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
                  🚧 DEV MODE
                </div>
              )}
              <ThemeToggle />
              {!isDevMode && (
                <form action={signOut}>
                  <Button variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="tolerance">Tolerance</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="track">Quick Track</TabsTrigger>
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
