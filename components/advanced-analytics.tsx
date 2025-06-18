"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Consumable, ConsumptionEntry, RawProduct } from "@/lib/types"
import { CONSUMPTION_METHODS } from "@/lib/types"
import { eachWeekOfInterval, format, parseISO, subWeeks } from "date-fns"
import { Activity, Calculator, PieChartIcon, Target, TrendingUp, Zap } from "lucide-react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts"

interface AdvancedAnalyticsProps {
    entries: ConsumptionEntry[]
    rawProducts: RawProduct[]
    consumables: Consumable[]
}

interface StrainAnalytics {
    strain: string
    totalGrams: number
    totalCost: number
    avgThcContent: number
    avgEfficiency: number
    pricePerGram: number
    costPerMgThc: number
    effectiveThcConsumed: number
    sessionsCount: number
    avgRating: number
    lastUsed: string
}

interface PredictiveMetrics {
    weeklyConsumption: number
    weeklyCost: number
    monthlyProjection: number
    inventoryDaysRemaining: number
}

export default function AdvancedAnalytics({ entries, rawProducts, consumables }: AdvancedAnalyticsProps) {
    // Calculate strain-based analytics
    const calculateStrainAnalytics = (): StrainAnalytics[] => {
        const strainMap = new Map<
            string,
            {
                grams: number
                cost: number
                thcContent: number[]
                efficiency: number[]
                sessions: number
                ratings: number[]
                lastUsed: string
            }
        >()

        // Process consumption entries
        entries.forEach((entry) => {
            const strain = entry.product_name
            const grams = Number(entry.amount)
            const method = entry.consumption_method
            const efficiency = method
                ? CONSUMPTION_METHODS[method as keyof typeof CONSUMPTION_METHODS]?.efficiency || 0.3
                : 0.3

            if (!strainMap.has(strain)) {
                strainMap.set(strain, {
                    grams: 0,
                    cost: 0,
                    thcContent: [],
                    efficiency: [],
                    sessions: 0,
                    ratings: [],
                    lastUsed: entry.consumed_at,
                })
            }

            const data = strainMap.get(strain)!
            data.grams += grams
            data.efficiency.push(efficiency)
            data.sessions += 1
            if (entry.rating) data.ratings.push(entry.rating)
            if (entry.consumed_at > data.lastUsed) data.lastUsed = entry.consumed_at
        })

        // Add raw product cost and THC data
        rawProducts.forEach((product) => {
            const strain = product.strain_name
            if (strainMap.has(strain)) {
                const data = strainMap.get(strain)!
                data.cost += Number(product.cost || 0)
                if (product.thc_content) data.thcContent.push(Number(product.thc_content))
            }
        })

        // Convert to analytics array
        return Array.from(strainMap.entries())
            .map(([strain, data]) => {
                const avgThcContent =
                    data.thcContent.length > 0 ? data.thcContent.reduce((a, b) => a + b, 0) / data.thcContent.length : 20 // Default 20%

                const avgEfficiency =
                    data.efficiency.length > 0 ? data.efficiency.reduce((a, b) => a + b, 0) / data.efficiency.length : 0.3

                const effectiveThcConsumed = data.grams * (avgThcContent / 100) * avgEfficiency * 1000 // in mg
                const pricePerGram = data.cost > 0 ? data.cost / data.grams : 0
                const costPerMgThc = effectiveThcConsumed > 0 ? data.cost / effectiveThcConsumed : 0
                const avgRating = data.ratings.length > 0 ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length : 0

                return {
                    strain,
                    totalGrams: data.grams,
                    totalCost: data.cost,
                    avgThcContent,
                    avgEfficiency,
                    pricePerGram,
                    costPerMgThc,
                    effectiveThcConsumed,
                    sessionsCount: data.sessions,
                    avgRating,
                    lastUsed: data.lastUsed,
                }
            })
            .sort((a, b) => b.totalGrams - a.totalGrams)
    }

    // Calculate predictive metrics
    const calculatePredictiveMetrics = (): PredictiveMetrics => {
        const today = new Date()
        const fourWeeksAgo = subWeeks(today, 4)

        const last4Weeks = entries.filter((entry) => {
            const entryDate = parseISO(entry.consumed_at)
            return entryDate >= fourWeeksAgo
        })

        // Calculate how many weeks of data we actually have
        let oldestEntryDate = today
        if (last4Weeks.length > 0) {
            oldestEntryDate = last4Weeks.reduce((oldest, entry) => {
                const entryDate = parseISO(entry.consumed_at)
                return entryDate < oldest ? entryDate : oldest
            }, today)
        }

        // Calculate actual number of weeks (minimum 1 to avoid division by zero)
        const actualWeeks = Math.max(1, Math.ceil((today.getTime() - oldestEntryDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
        const weeksToUse = Math.min(4, actualWeeks) // Cap at 4 weeks

        const weeklyConsumption = last4Weeks.reduce((sum, entry) => sum + Number(entry.amount), 0) / weeksToUse
        const dailyConsumption = weeklyConsumption / 7

        // Calculate total available inventory across consumables and raw products
        const rawProductInventory = rawProducts.reduce((sum, product) => {
            return sum + (Number(product.remaining_amount) || 0)
        }, 0)

        const consumableInventory = consumables.reduce((sum, consumable) => {
            // Convert consumable units to equivalent grams based on default weight
            const weight = consumable.weight_per_unit || 0.5 // Default to 0.5g if not specified
            return sum + ((Number(consumable.remaining_units) || 0) * weight)
        }, 0)

        const totalInventory = rawProductInventory + consumableInventory

        // Calculate days remaining based on daily consumption rate
        // Avoid division by zero
        const inventoryDaysRemaining = dailyConsumption > 0
            ? Math.round(totalInventory / dailyConsumption)
            : (totalInventory > 0 ? 999 : 0) // If no consumption but inventory exists, show 999 days

        // Calculate weekly and monthly costs
        const weeklyCost = calculateWeeklyCost(last4Weeks, weeksToUse)
        const monthlyProjection = weeklyCost * 4.3 // Average weeks in a month

        console.log({
            dailyConsumption,
            rawProductInventory,
            consumableInventory,
            totalInventory,
            inventoryDaysRemaining
        })

        return {
            weeklyConsumption,
            weeklyCost,
            monthlyProjection,
            inventoryDaysRemaining,
        }
    }

    // Helper function to calculate weekly cost
    const calculateWeeklyCost = (recentEntries: ConsumptionEntry[], weeksToUse: number): number => {
        // Map consumption entries to their associated products to get cost data
        const entryCosts = recentEntries.map(entry => {
            // Find the associated consumable or raw product to get the cost
            const consumable = consumables.find(c => c.id === entry.consumable_id)
            if (consumable) {
                // Calculate cost per unit
                const costPerUnit = consumable.cost_per_unit || 0
                return Number(entry.amount) * costPerUnit
            }
            return 0 // Default if no matching product found
        })

        const totalCost = entryCosts.reduce((sum, cost) => sum + cost, 0)
        return totalCost / weeksToUse
    }

    // Calculate weekly consumption trend
    const calculateWeeklyTrend = () => {
        const last12Weeks = eachWeekOfInterval({
            start: subWeeks(new Date(), 11),
            end: new Date(),
        })

        return last12Weeks.map((weekStart) => {
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)

            const weekEntries = entries.filter((entry) => {
                const entryDate = parseISO(entry.consumed_at)
                return entryDate >= weekStart && entryDate <= weekEnd
            })

            const totalGrams = weekEntries.reduce((sum, entry) => sum + Number(entry.amount), 0)
            const totalSessions = weekEntries.length
            const avgRating =
                weekEntries.length > 0
                    ? weekEntries.reduce((sum, entry) => sum + (entry.rating || 0), 0) / weekEntries.length
                    : 0

            return {
                week: format(weekStart, "MMM dd"),
                grams: Number(totalGrams.toFixed(1)),
                sessions: totalSessions,
                rating: Number(avgRating.toFixed(1)),
            }
        })
    }

    const strainAnalytics = calculateStrainAnalytics()
    const predictiveMetrics = calculatePredictiveMetrics()
    const weeklyTrend = calculateWeeklyTrend()

    // Efficiency comparison data
    const efficiencyData = Object.entries(CONSUMPTION_METHODS)
        .map(([method, config]) => {
            const methodEntries = entries.filter((entry) => entry.consumption_method === method)
            const totalGrams = methodEntries.reduce((sum, entry) => sum + Number(entry.amount), 0)
            const effectiveGrams = totalGrams * config.efficiency

            return {
                method,
                efficiency: Math.round(config.efficiency * 100),
                totalGrams: Number(totalGrams.toFixed(1)),
                effectiveGrams: Number(effectiveGrams.toFixed(1)),
                sessions: methodEntries.length,
            }
        })
        .filter((data) => data.sessions > 0)

    const COLORS = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Consumption</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{predictiveMetrics.weeklyConsumption.toFixed(1)}g</div>
                        <p className="text-xs text-muted-foreground">CHF {predictiveMetrics.weeklyCost.toFixed(2)} per week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Projection</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">CHF {predictiveMetrics.monthlyProjection.toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground">Trend: stable</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inventory Days</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{predictiveMetrics.inventoryDaysRemaining}</div>
                        <p className="text-xs text-muted-foreground">days remaining</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Cost/mg THC</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            CHF{" "}
                            {strainAnalytics.length > 0
                                ? (
                                    strainAnalytics.reduce((sum, strain) => sum + strain.costPerMgThc, 0) / strainAnalytics.length
                                ).toFixed(3)
                                : "0.000"}
                        </div>
                        <p className="text-xs text-muted-foreground">per mg active ingredient</p>
                    </CardContent>
                </Card>
            </div>

            {/* Strain Analytics Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Strain Cost-Benefit Analysis</CardTitle>
                    <CardDescription>Detailed economics per strain (inspired by your Excel analysis)</CardDescription>
                </CardHeader>
                <CardContent>
                    {strainAnalytics.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No strain data available yet.</p>
                            <p className="text-sm">Add some consumption entries to see analytics!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Strain</th>
                                        <th className="text-right p-2">Total Grams</th>
                                        <th className="text-right p-2">Total Cost</th>
                                        <th className="text-right p-2">CHF/g</th>
                                        <th className="text-right p-2">THC%</th>
                                        <th className="text-right p-2">Efficiency</th>
                                        <th className="text-right p-2">CHF/mg THC</th>
                                        <th className="text-right p-2">Sessions</th>
                                        <th className="text-right p-2">Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {strainAnalytics.map((strain, index) => (
                                        <tr key={strain.strain} className="border-b hover:bg-muted/50">
                                            <td className="p-2 font-medium">{strain.strain}</td>
                                            <td className="p-2 text-right">{strain.totalGrams.toFixed(1)}g</td>
                                            <td className="p-2 text-right">CHF {strain.totalCost.toFixed(2)}</td>
                                            <td className="p-2 text-right">CHF {strain.pricePerGram.toFixed(2)}</td>
                                            <td className="p-2 text-right">{strain.avgThcContent.toFixed(1)}%</td>
                                            <td className="p-2 text-right">{Math.round(strain.avgEfficiency * 100)}%</td>
                                            <td className="p-2 text-right">
                                                <Badge
                                                    variant={
                                                        strain.costPerMgThc < 0.15
                                                            ? "default"
                                                            : strain.costPerMgThc < 0.25
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                >
                                                    CHF {strain.costPerMgThc.toFixed(3)}
                                                </Badge>
                                            </td>
                                            <td className="p-2 text-right">{strain.sessionsCount}</td>
                                            <td className="p-2 text-right">
                                                {strain.avgRating > 0 ? `${strain.avgRating.toFixed(1)}/5` : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Weekly Consumption Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Consumption Trend</CardTitle>
                    <CardDescription>Track your usage patterns over the last 12 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            grams: {
                                label: "Grams",
                                color: "hsl(var(--chart-1))",
                            },
                            sessions: {
                                label: "Sessions",
                                color: "hsl(var(--chart-2))",
                            },
                        }}
                        className="h-[280px] w-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                <XAxis
                                    dataKey="week"
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
                                    dataKey="grams"
                                    stroke="var(--color-grams)"
                                    strokeWidth={2.5}
                                    dot={{ fill: "var(--color-grams)", strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sessions"
                                    stroke="var(--color-sessions)"
                                    strokeWidth={2.5}
                                    dot={{ fill: "var(--color-sessions)", strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Efficiency Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Consumption Method Efficiency
                        </CardTitle>
                        <CardDescription>Compare effectiveness of different consumption methods</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                effectiveGrams: {
                                    label: "Effective Grams",
                                    color: "hsl(var(--chart-3))",
                                },
                            }}
                            className="h-[220px] w-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={efficiencyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                    <XAxis
                                        dataKey="method"
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
                                    <Bar
                                        dataKey="effectiveGrams"
                                        fill="var(--color-effectiveGrams)"
                                        radius={[3, 3, 0, 0]}
                                        opacity={0.8}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Consumption Distribution
                        </CardTitle>
                        <CardDescription>How you consume by method</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                sessions: {
                                    label: "Sessions",
                                    color: "hsl(var(--chart-4))",
                                },
                            }}
                            className="h-[220px] w-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <Pie
                                        data={efficiencyData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ method, sessions, percent }) => `${method}: ${sessions} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={70}
                                        fill="#8884d8"
                                        dataKey="sessions"
                                        stroke="hsl(var(--background))"
                                        strokeWidth={2}
                                    >
                                        {efficiencyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "6px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Restock Recommendations */}
            {predictiveMetrics.inventoryDaysRemaining < 30 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Restock Recommendations
                        </CardTitle>
                        <CardDescription>Based on your consumption patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {rawProducts
                                .filter((product) => Number(product.remaining_amount) < predictiveMetrics.weeklyConsumption)
                                .map((product) => (
                                    <div key={product.strain_name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                        <span className="font-medium">{product.strain_name}</span>
                                        <Badge variant="destructive">Low Stock</Badge>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
