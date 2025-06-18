"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ConsumptionEntry } from "@/lib/types"
import { eachDayOfInterval, format, parseISO, startOfDay, subDays } from "date-fns"
import { BarChart3, Calendar, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import AdvancedAnalytics from "./advanced-analytics"

interface DashboardProps {
    entries: ConsumptionEntry[]
    rawProducts: any[]
    consumables: any[]
}

export default function ConsumptionDashboard({ entries, rawProducts, consumables }: DashboardProps) {
    // Process data for daily consumption chart
    const processChartData = () => {
        const last30Days = eachDayOfInterval({
            start: subDays(new Date(), 29),
            end: new Date(),
        })

        const dailyData = last30Days.map((day) => {
            const dayStart = startOfDay(day)
            const dayEntries = entries.filter((entry) => {
                const entryDate = startOfDay(parseISO(entry.consumed_at))
                return entryDate.getTime() === dayStart.getTime()
            })

            const totalAmount = dayEntries.reduce((sum, entry) => sum + Number(entry.amount), 0)
            const entryCount = dayEntries.length

            return {
                date: format(day, "MMM dd"),
                amount: totalAmount,
                count: entryCount,
            }
        })

        return dailyData
    }

    // Process data for product breakdown
    const processProductData = () => {
        const productTotals = entries.reduce(
            (acc, entry) => {
                const key = entry.product_name
                if (!acc[key]) {
                    acc[key] = { product: key, amount: 0, count: 0 }
                }
                acc[key].amount += Number(entry.amount)
                acc[key].count += 1
                return acc
            },
            {} as Record<string, { product: string; amount: number; count: number }>,
        )

        return Object.values(productTotals)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
    }

    const chartData = processChartData()
    const productData = processProductData()
    const totalEntries = entries.length
    const totalAmount = entries.reduce((sum, entry) => sum + Number(entry.amount), 0)

    // Calculate actual number of days with data instead of assuming 30
    const daysWithData = chartData.filter(day => day.amount > 0).length

    // Calculate average based on recent trends (last 7 days)
    const last7DaysData = chartData.slice(-7);
    const last7DaysTotal = last7DaysData.reduce((sum, day) => sum + day.amount, 0);
    const daysWithDataLast7 = last7DaysData.filter(day => day.amount > 0).length;

    // Calculate daily averages with different methods
    const avgDaily = daysWithData > 0
        ? chartData.reduce((sum, day) => sum + day.amount, 0) / daysWithData
        : totalAmount / 30;

    const avgDailyRecent = daysWithDataLast7 > 0
        ? last7DaysTotal / daysWithDataLast7
        : avgDaily;

    // Use the recent average if available, otherwise fall back to the overall average
    const displayedAverage = daysWithDataLast7 > 0 ? avgDailyRecent : avgDaily;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{totalEntries}</div>
                        <p className="text-xs text-muted-foreground">consumption records</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{totalAmount.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">units consumed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{displayedAverage.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">
                            units per day (last {daysWithDataLast7 > 0 ? "7" : "30"} days)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Consumption Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Consumption (Last 30 Days)</CardTitle>
                    <CardDescription>Track your consumption patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            amount: {
                                label: "Amount (g)",
                                color: "hsl(var(--chart-1))",
                            },
                        }}
                        className="h-[250px] w-full"
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
                                    dataKey="amount"
                                    stroke="var(--color-amount)"
                                    strokeWidth={2.5}
                                    dot={{ fill: "var(--color-amount)", strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5, stroke: "var(--color-amount)", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Product Breakdown */}
            {productData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Top Products</CardTitle>
                        <CardDescription>Your most consumed products</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                amount: {
                                    label: "Amount (g)",
                                    color: "hsl(var(--chart-2))",
                                },
                            }}
                            className="h-[200px] w-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                    <XAxis
                                        dataKey="product"
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
                                    <Bar dataKey="amount" fill="var(--color-amount)" radius={[3, 3, 0, 0]} opacity={0.8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

            <AdvancedAnalytics entries={entries} rawProducts={rawProducts} consumables={consumables} />
        </div>
    )
}
