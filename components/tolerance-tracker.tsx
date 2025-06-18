"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Plus, Loader2, TrendingUp, Calendar, Target, AlertTriangle } from "lucide-react"
import { addToleranceEntry, type ToleranceTracking } from "@/lib/consumption-actions"
import { format, parseISO, differenceInDays } from "date-fns"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          Add Tolerance Entry
        </>
      )}
    </Button>
  )
}

interface ToleranceTrackerProps {
  toleranceData: ToleranceTracking[]
}

export default function ToleranceTracker({ toleranceData }: ToleranceTrackerProps) {
  const [state, formAction] = useActionState(addToleranceEntry, null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Process data for chart
  const chartData = toleranceData
    .slice(0, 20) // Last 20 entries
    .reverse()
    .map((entry) => ({
      date: format(parseISO(entry.tracking_date), "MMM dd"),
      baseline: Number(entry.baseline_amount),
      effectiveness: entry.effectiveness_rating,
    }))

  // Calculate tolerance insights
  const calculateToleranceInsights = () => {
    if (toleranceData.length < 2) return null

    const recent = toleranceData.slice(0, 5)
    const older = toleranceData.slice(5, 10)

    const recentAvgBaseline = recent.reduce((sum, entry) => sum + Number(entry.baseline_amount), 0) / recent.length
    const olderAvgBaseline =
      older.length > 0
        ? older.reduce((sum, entry) => sum + Number(entry.baseline_amount), 0) / older.length
        : recentAvgBaseline

    const recentAvgEffectiveness = recent.reduce((sum, entry) => sum + entry.effectiveness_rating, 0) / recent.length
    const olderAvgEffectiveness =
      older.length > 0
        ? older.reduce((sum, entry) => sum + entry.effectiveness_rating, 0) / older.length
        : recentAvgEffectiveness

    const toleranceIncrease = ((recentAvgBaseline - olderAvgBaseline) / olderAvgBaseline) * 100
    const effectivenessChange = ((recentAvgEffectiveness - olderAvgEffectiveness) / olderAvgEffectiveness) * 100

    // Check for active tolerance break
    const activeBreak = toleranceData.find(
      (entry) =>
        entry.tolerance_break_start && (!entry.tolerance_break_end || parseISO(entry.tolerance_break_end) > new Date()),
    )

    return {
      toleranceIncrease: Math.round(toleranceIncrease),
      effectivenessChange: Math.round(effectivenessChange),
      recentAvgBaseline: recentAvgBaseline.toFixed(2),
      recentAvgEffectiveness: recentAvgEffectiveness.toFixed(1),
      activeBreak,
      needsBreak: toleranceIncrease > 50 || effectivenessChange < -20,
    }
  }

  const insights = calculateToleranceInsights()

  return (
    <div className="space-y-6">
      {/* Tolerance Insights */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Baseline Amount</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{insights.recentAvgBaseline}g</div>
              <p className="text-xs text-muted-foreground">
                {insights.toleranceIncrease > 0 ? "+" : ""}
                {insights.toleranceIncrease}% vs previous
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Effectiveness</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{insights.recentAvgEffectiveness}/10</div>
              <p className="text-xs text-muted-foreground">
                {insights.effectivenessChange > 0 ? "+" : ""}
                {insights.effectivenessChange}% vs previous
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tolerance Status</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${insights.needsBreak ? "text-red-500" : "text-green-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${insights.needsBreak ? "text-red-500" : "text-green-500"}`}>
                {insights.needsBreak ? "High" : "Normal"}
              </div>
              <p className="text-xs text-muted-foreground">
                {insights.needsBreak ? "Consider a tolerance break" : "Tolerance levels healthy"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Tolerance Break */}
      {insights?.activeBreak && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Calendar className="h-5 w-5" />
              Active Tolerance Break
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-blue-600 dark:text-blue-400">
                Started: {format(parseISO(insights.activeBreak.tolerance_break_start!), "MMM dd, yyyy")}
              </p>
              <p className="text-blue-600 dark:text-blue-400">
                Duration: {differenceInDays(new Date(), parseISO(insights.activeBreak.tolerance_break_start!))} days
              </p>
              {insights.activeBreak.tolerance_break_end && (
                <p className="text-blue-600 dark:text-blue-400">
                  Planned end: {format(parseISO(insights.activeBreak.tolerance_break_end), "MMM dd, yyyy")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tolerance Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tolerance Trend</CardTitle>
            <CardDescription>Track your baseline amount and effectiveness over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                baseline: {
                  label: "Baseline Amount (g)",
                  color: "hsl(var(--chart-1))",
                },
                effectiveness: {
                  label: "Effectiveness (1-10)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[280px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="date"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                    tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                    tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="var(--color-baseline)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--color-baseline)", strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="effectiveness"
                    stroke="var(--color-effectiveness)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--color-effectiveness)", strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Tolerance Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tolerance History
          </CardTitle>
          <CardDescription>Your recent tolerance tracking entries</CardDescription>
        </CardHeader>
        <CardContent>
          {toleranceData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tolerance data yet.</p>
              <p className="text-sm">Start tracking to monitor your tolerance levels!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {toleranceData.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {format(parseISO(entry.tracking_date), "MMM dd, yyyy")}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {Number(entry.baseline_amount).toFixed(2)}g baseline
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {entry.effectiveness_rating}/10 effectiveness
                      </Badge>
                    </div>
                    {entry.tolerance_break_start && (
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Tolerance break: {format(parseISO(entry.tolerance_break_start), "MMM dd")}
                        {entry.tolerance_break_end && ` - ${format(parseISO(entry.tolerance_break_end), "MMM dd")}`}
                      </div>
                    )}
                    {entry.notes && <div className="text-xs text-muted-foreground mt-1 italic">"{entry.notes}"</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Tolerance Entry Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Track Tolerance</CardTitle>
              <CardDescription>Record your baseline amount and effectiveness</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)} className="shrink-0">
              {showAddForm ? "Cancel" : "Add Entry"}
            </Button>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive px-3 py-2 rounded-md text-sm animate-fade-in">
                  {state.error}
                </div>
              )}

              {state?.success && (
                <div className="bg-primary/10 border border-primary/50 text-primary px-3 py-2 rounded-md text-sm animate-fade-in">
                  {state.success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking_date" className="text-sm font-medium">
                    Date
                  </Label>
                  <Input
                    id="tracking_date"
                    name="tracking_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="bg-card border-border focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseline_amount" className="text-sm font-medium">
                    Baseline Amount (g)
                  </Label>
                  <Input
                    id="baseline_amount"
                    name="baseline_amount"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.5"
                    required
                    className="bg-card border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveness_rating" className="text-sm font-medium">
                  Effectiveness Rating (1-10)
                </Label>
                <Input
                  id="effectiveness_rating"
                  name="effectiveness_rating"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="7"
                  required
                  className="bg-card border-border focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  How effective was this amount? 1 = No effect, 10 = Perfect effect
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tolerance_break_start" className="text-sm font-medium">
                    Tolerance Break Start (optional)
                  </Label>
                  <Input
                    id="tolerance_break_start"
                    name="tolerance_break_start"
                    type="date"
                    className="bg-card border-border focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tolerance_break_end" className="text-sm font-medium">
                    Tolerance Break End (optional)
                  </Label>
                  <Input
                    id="tolerance_break_end"
                    name="tolerance_break_end"
                    type="date"
                    className="bg-card border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="How are you feeling? Any changes in tolerance? Effects noticed..."
                  rows={2}
                  className="bg-card border-border focus:ring-primary resize-none"
                />
              </div>

              <SubmitButton />
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
