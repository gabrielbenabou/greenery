"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Settings, Loader2, DollarSign, AlertTriangle, TrendingUp, X } from "lucide-react"
import {
  updateBudgetSettings,
  acknowledgeAlert,
  type BudgetSettings,
  type BudgetAlert,
  type RawProduct,
} from "@/lib/consumption-actions"
import { format, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Settings className="mr-2 h-4 w-4" />
          Update Budget Settings
        </>
      )}
    </Button>
  )
}

interface BudgetManagerProps {
  budgetSettings: BudgetSettings | null
  budgetAlerts: BudgetAlert[]
  rawProducts: RawProduct[]
}

export default function BudgetManager({ budgetSettings, budgetAlerts, rawProducts }: BudgetManagerProps) {
  const [state, formAction] = useActionState(updateBudgetSettings, null)
  const [showSettings, setShowSettings] = useState(!budgetSettings)

  // Calculate spending data
  const calculateSpendingData = () => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    })

    return last6Months.map((month) => {
      const monthStart = startOfMonth(month)
      const nextMonth = new Date(monthStart)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const monthlySpending = rawProducts
        .filter((product) => {
          const purchaseDate = new Date(product.purchase_date)
          return purchaseDate >= monthStart && purchaseDate < nextMonth
        })
        .reduce((sum, product) => sum + (Number(product.cost) || 0), 0)

      return {
        month: format(month, "MMM yyyy"),
        spending: monthlySpending,
      }
    })
  }

  // Calculate current month spending
  const calculateCurrentMonthSpending = () => {
    const startOfCurrentMonth = startOfMonth(new Date())
    return rawProducts
      .filter((product) => new Date(product.purchase_date) >= startOfCurrentMonth)
      .reduce((sum, product) => sum + (Number(product.cost) || 0), 0)
  }

  const spendingData = calculateSpendingData()
  const currentMonthSpending = calculateCurrentMonthSpending()
  const budgetUsedPercentage = budgetSettings
    ? Math.min((currentMonthSpending / budgetSettings.monthly_budget) * 100, 100)
    : 0

  const handleAcknowledgeAlert = async (alertId: string) => {
    await acknowledgeAlert(alertId)
  }

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-3">
          {budgetAlerts.map((alert) => (
            <Card key={alert.id} className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-300">
                        {alert.alert_type === "budget_exceeded"
                          ? "Budget Exceeded!"
                          : alert.alert_type === "monthly_threshold"
                            ? "Monthly Budget Alert"
                            : "Weekly Budget Alert"}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        You've spent CHF {alert.current_spending.toFixed(2)} of CHF {alert.budget_limit.toFixed(2)}(
                        {alert.percentage_used.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Budget Overview */}
      {budgetSettings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">CHF {budgetSettings.monthly_budget.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">CHF {currentMonthSpending.toFixed(2)} spent this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{budgetUsedPercentage.toFixed(1)}%</div>
              <Progress value={budgetUsedPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                CHF {Math.max(0, budgetSettings.monthly_budget - currentMonthSpending).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {budgetUsedPercentage >= 100 ? "Budget exceeded" : "Available this month"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Spending Chart */}
      {spendingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
            <CardDescription>Track your cannabis spending over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                spending: {
                  label: "Spending (CHF)",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[280px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="month"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 10 }}
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
                  <Bar dataKey="spending" fill="var(--color-spending)" radius={[3, 3, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Budget Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Settings</CardTitle>
              <CardDescription>Set your monthly budget and alert preferences</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="shrink-0">
              {showSettings ? "Cancel" : "Edit Settings"}
            </Button>
          </div>
        </CardHeader>
        {showSettings && (
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
                  <Label htmlFor="monthly_budget" className="text-sm font-medium">
                    Monthly Budget (CHF)
                  </Label>
                  <Input
                    id="monthly_budget"
                    name="monthly_budget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="200.00"
                    defaultValue={budgetSettings?.monthly_budget || ""}
                    required
                    className="bg-card border-border focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekly_budget" className="text-sm font-medium">
                    Weekly Budget (CHF) - Optional
                  </Label>
                  <Input
                    id="weekly_budget"
                    name="weekly_budget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    defaultValue={budgetSettings?.weekly_budget || ""}
                    className="bg-card border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert_threshold" className="text-sm font-medium">
                  Alert Threshold (%)
                </Label>
                <Input
                  id="alert_threshold"
                  name="alert_threshold"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="80"
                  defaultValue={budgetSettings?.alert_threshold || "80"}
                  required
                  className="bg-card border-border focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Get alerted when you reach this percentage of your budget
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_alerts" className="text-sm font-medium">
                      Email Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">Receive budget alerts via email</p>
                  </div>
                  <Switch id="email_alerts" name="email_alerts" defaultChecked={budgetSettings?.email_alerts ?? true} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_alerts" className="text-sm font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">Receive budget alerts as push notifications</p>
                  </div>
                  <Switch id="push_alerts" name="push_alerts" defaultChecked={budgetSettings?.push_alerts ?? true} />
                </div>
              </div>

              <SubmitButton />
            </form>
          </CardContent>
        )}
        {!showSettings && budgetSettings && (
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Budget:</span>
                <span className="font-medium">CHF {budgetSettings.monthly_budget.toFixed(2)}</span>
              </div>
              {budgetSettings.weekly_budget && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Weekly Budget:</span>
                  <span className="font-medium">CHF {budgetSettings.weekly_budget.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Alert Threshold:</span>
                <span className="font-medium">{budgetSettings.alert_threshold}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Notifications:</span>
                <div className="flex gap-2">
                  {budgetSettings.email_alerts && <Badge variant="secondary">Email</Badge>}
                  {budgetSettings.push_alerts && <Badge variant="secondary">Push</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
