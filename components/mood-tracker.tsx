"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
    addMoodTracking,
    updatePostMood,
} from "@/lib/consumption-actions"
import {
    ACTIVITIES,
    COMMON_SIDE_EFFECTS,
    ENVIRONMENTS,
    MOOD_CATEGORIES,
    type ConsumptionEntry,
    type MoodCorrelation,
    type MoodTracking,
} from "@/lib/types"
import { differenceInHours, format, parseISO } from "date-fns"
import { AlertCircle, Brain, Clock, Loader2, Plus, Smile, Star, TrendingUp, Zap } from "lucide-react"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

function SubmitButton({ isUpdate = false }: { isUpdate?: boolean }) {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUpdate ? "Updating..." : "Saving..."}
                </>
            ) : (
                <>
                    <Plus className="mr-2 h-4 w-4" />
                    {isUpdate ? "Update Post-Mood" : "Track Pre-Mood"}
                </>
            )}
        </Button>
    )
}

function MoodSlider({
    category,
    value,
    onChange,
    isStress = false,
    isAnxiety = false,
    isPain = false,
}: {
    category: string
    value: number
    onChange: (value: number) => void
    isStress?: boolean
    isAnxiety?: boolean
    isPain?: boolean
}) {
    const getColorClass = () => {
        if (isStress || isAnxiety || isPain) {
            // For negative metrics, lower is better
            if (value <= 3) return "text-green-500"
            if (value <= 6) return "text-yellow-500"
            return "text-red-500"
        } else {
            // For positive metrics, higher is better
            if (value >= 7) return "text-green-500"
            if (value >= 4) return "text-yellow-500"
            return "text-red-500"
        }
    }

    const getDescription = () => {
        if (isStress || isAnxiety || isPain) {
            if (value <= 2) return "Very Low"
            if (value <= 4) return "Low"
            if (value <= 6) return "Moderate"
            if (value <= 8) return "High"
            return "Very High"
        } else {
            if (value <= 2) return "Very Low"
            if (value <= 4) return "Low"
            if (value <= 6) return "Moderate"
            if (value <= 8) return "High"
            return "Very High"
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{category}</Label>
                <div className={`text-sm font-medium ${getColorClass()}`}>
                    {value}/10 - {getDescription()}
                </div>
            </div>
            <Slider
                value={[value]}
                onValueChange={(values) => onChange(values[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>5</span>
                <span>10</span>
            </div>
        </div>
    )
}

interface MoodTrackerProps {
    moodData: (MoodTracking & { consumption_entries: any })[]
    correlations: MoodCorrelation[]
    pendingEntries: ConsumptionEntry[]
}

function StarRating({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange(star)}
                    className="p-1 hover:scale-110 transition-transform"
                >
                    <Star
                        className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                            }`}
                    />
                </button>
            ))}
        </div>
    )
}

export default function MoodTracker({ moodData, correlations, pendingEntries }: MoodTrackerProps) {
    const [preMoodState, preMoodAction] = useActionState(addMoodTracking, null)
    const [postMoodState, postMoodAction] = useActionState(updatePostMood, null)
    const [showPreMoodForm, setShowPreMoodForm] = useState(false)
    const [showPostMoodForm, setShowPostMoodForm] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<string>("")
    const [selectedMoodTracking, setSelectedMoodTracking] = useState<string>("")

    // Pre-mood form state
    const [preMoodValues, setPreMoodValues] = useState({
        energy: 5,
        happiness: 5,
        stress: 5,
        focus: 5,
        anxiety: 5,
        pain: 5,
    })

    // Post-mood form state
    const [postMoodValues, setPostMoodValues] = useState({
        energy: 5,
        happiness: 5,
        stress: 5,
        focus: 5,
        anxiety: 5,
        pain: 5,
    })

    const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([])
    const [effectsIntensity, setEffectsIntensity] = useState(5)
    const [experienceRating, setExperienceRating] = useState(0)

    // Process mood trend data
    const processMoodTrend = () => {
        return moodData
            .filter((mood) => mood.post_mood_energy !== null)
            .slice(0, 20)
            .reverse()
            .map((mood) => ({
                date: format(parseISO(mood.created_at), "MMM dd"),
                energyChange: mood.post_mood_energy! - mood.pre_mood_energy,
                happinessChange: mood.post_mood_happiness! - mood.pre_mood_happiness,
                stressChange: mood.pre_mood_stress - mood.post_mood_stress, // Inverted for positive change
                focusChange: mood.post_mood_focus! - mood.pre_mood_focus,
                anxietyChange: mood.pre_mood_anxiety - mood.post_mood_anxiety, // Inverted for positive change
                painChange: mood.pre_mood_pain - mood.post_mood_pain, // Inverted for positive change
            }))
    }

    // Process correlation radar data
    const processCorrelationData = () => {
        if (correlations.length === 0) return []

        return correlations.slice(0, 5).map((correlation) => ({
            strain: correlation.strain_name || "Unknown",
            method: correlation.consumption_method || "Unknown",
            energy: Math.round(correlation.avg_energy_change * 10) / 10,
            happiness: Math.round(correlation.avg_happiness_change * 10) / 10,
            stress: Math.round(-correlation.avg_stress_change * 10) / 10, // Inverted
            focus: Math.round(correlation.avg_focus_change * 10) / 10,
            anxiety: Math.round(-correlation.avg_anxiety_change * 10) / 10, // Inverted
            pain: Math.round(-correlation.avg_pain_change * 10) / 10, // Inverted
            sessions: correlation.sessions_count,
        }))
    }

    const moodTrendData = processMoodTrend()
    const correlationData = processCorrelationData()

    // Get incomplete mood tracking entries (have pre but not post)
    const incompleteMoodEntries = moodData.filter((mood) => mood.post_mood_energy === null)

    const handleSideEffectChange = (effect: string, checked: boolean) => {
        if (checked) {
            setSelectedSideEffects([...selectedSideEffects, effect])
        } else {
            setSelectedSideEffects(selectedSideEffects.filter((e) => e !== effect))
        }
    }

    return (
        <div className="space-y-6">
            {/* Pending Mood Updates Alert */}
            {(pendingEntries.length > 0 || incompleteMoodEntries.length > 0) && (
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                            <AlertCircle className="h-5 w-5" />
                            Pending Mood Updates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingEntries.length > 0 && (
                                <div>
                                    <p className="text-orange-600 dark:text-orange-400 mb-2">Recent sessions without mood tracking:</p>
                                    <div className="space-y-2">
                                        {pendingEntries.slice(0, 3).map((entry) => (
                                            <div key={entry.id} className="flex items-center justify-between p-2 rounded border bg-card/50">
                                                <div>
                                                    <span className="font-medium">{entry.product_name}</span>
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                        {format(parseISO(entry.consumed_at), "MMM dd, h:mm a")}
                                                    </span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedEntry(entry.id)
                                                        setShowPreMoodForm(true)
                                                    }}
                                                >
                                                    Add Mood Data
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {incompleteMoodEntries.length > 0 && (
                                <div>
                                    <p className="text-orange-600 dark:text-orange-400 mb-2">
                                        Sessions ready for post-consumption mood update:
                                    </p>
                                    <div className="space-y-2">
                                        {incompleteMoodEntries.slice(0, 3).map((mood) => (
                                            <div key={mood.id} className="flex items-center justify-between p-2 rounded border bg-card/50">
                                                <div>
                                                    <span className="font-medium">{mood.consumption_entries.product_name}</span>
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                        {format(parseISO(mood.consumption_entries.consumed_at), "MMM dd, h:mm a")}
                                                    </span>
                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                        {differenceInHours(new Date(), parseISO(mood.consumption_entries.consumed_at))}h ago
                                                    </Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedMoodTracking(mood.id)
                                                        setShowPostMoodForm(true)
                                                    }}
                                                >
                                                    Update Post-Mood
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mood Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{moodData.length}</div>
                        <p className="text-xs text-muted-foreground">mood tracked</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Mood Improvement</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {moodData.length > 0
                                ? (
                                    moodData
                                        .filter((m) => m.post_mood_happiness !== null)
                                        .reduce((sum, m) => sum + (m.post_mood_happiness! - m.pre_mood_happiness), 0) /
                                    moodData.filter((m) => m.post_mood_happiness !== null).length
                                ).toFixed(1)
                                : "0.0"}
                        </div>
                        <p className="text-xs text-muted-foreground">happiness points</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Best Strain</CardTitle>
                        <Smile className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {correlations.length > 0
                                ? correlations.sort((a, b) => b.avg_happiness_change - a.avg_happiness_change)[0].strain_name
                                : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">for happiness</p>
                    </CardContent>
                </Card>
            </div>

            {/* Mood Trend Chart */}
            {moodTrendData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mood Change Trends</CardTitle>
                        <CardDescription>Track how different sessions affect your mood over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                energyChange: {
                                    label: "Energy Change",
                                    color: "hsl(var(--chart-1))",
                                },
                                happinessChange: {
                                    label: "Happiness Change",
                                    color: "hsl(var(--chart-2))",
                                },
                                stressChange: {
                                    label: "Stress Relief",
                                    color: "hsl(var(--chart-3))",
                                },
                            }}
                            className="h-[280px] w-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={moodTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                                        dataKey="energyChange"
                                        stroke="var(--color-energyChange)"
                                        strokeWidth={2.5}
                                        dot={{ fill: "var(--color-energyChange)", strokeWidth: 2, r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="happinessChange"
                                        stroke="var(--color-happinessChange)"
                                        strokeWidth={2.5}
                                        dot={{ fill: "var(--color-happinessChange)", strokeWidth: 2, r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="stressChange"
                                        stroke="var(--color-stressChange)"
                                        strokeWidth={2.5}
                                        dot={{ fill: "var(--color-stressChange)", strokeWidth: 2, r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

            {/* Strain/Method Correlations */}
            {correlations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Strain & Method Effectiveness</CardTitle>
                        <CardDescription>How different strains and methods affect your mood</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {correlations.slice(0, 5).map((correlation) => (
                                <div
                                    key={`${correlation.strain_name}-${correlation.consumption_method}`}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium">{correlation.strain_name}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {correlation.consumption_method}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {correlation.sessions_count} sessions
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Zap className="h-3 w-3 text-yellow-500" />
                                                <span>
                                                    Energy: {correlation.avg_energy_change > 0 ? "+" : ""}
                                                    {correlation.avg_energy_change.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Smile className="h-3 w-3 text-green-500" />
                                                <span>
                                                    Happiness: {correlation.avg_happiness_change > 0 ? "+" : ""}
                                                    {correlation.avg_happiness_change.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Brain className="h-3 w-3 text-blue-500" />
                                                <span>
                                                    Focus: {correlation.avg_focus_change > 0 ? "+" : ""}
                                                    {correlation.avg_focus_change.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pre-Consumption Mood Form */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Track Pre-Consumption Mood</CardTitle>
                            <CardDescription>Record how you feel before consuming</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setShowPreMoodForm(!showPreMoodForm)} className="shrink-0">
                            {showPreMoodForm ? "Cancel" : "Track Mood"}
                        </Button>
                    </div>
                </CardHeader>
                {showPreMoodForm && (
                    <CardContent>
                        <form action={preMoodAction} className="space-y-6">
                            {preMoodState?.error && (
                                <div className="bg-destructive/10 border border-destructive/50 text-destructive px-3 py-2 rounded-md text-sm">
                                    {preMoodState.error}
                                </div>
                            )}

                            {preMoodState?.success && (
                                <div className="bg-primary/10 border border-primary/50 text-primary px-3 py-2 rounded-md text-sm">
                                    {preMoodState.success}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="consumption_entry_id" className="text-sm font-medium">
                                    Select Recent Session
                                </Label>
                                <Select name="consumption_entry_id" value={selectedEntry} onValueChange={setSelectedEntry} required>
                                    <SelectTrigger className="bg-card border-border focus:ring-primary">
                                        <SelectValue placeholder="Choose a recent session" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pendingEntries.map((entry) => (
                                            <SelectItem key={entry.id} value={entry.id}>
                                                {entry.product_name} - {format(parseISO(entry.consumed_at), "MMM dd, h:mm a")}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-medium">How do you feel right now?</h3>

                                {Object.entries(MOOD_CATEGORIES).map(([key, config]) => (
                                    <div key={key}>
                                        <MoodSlider
                                            category={config.label}
                                            value={preMoodValues[key as keyof typeof preMoodValues]}
                                            onChange={(value) => setPreMoodValues((prev) => ({ ...prev, [key]: value }))}
                                            isStress={key === "stress"}
                                            isAnxiety={key === "anxiety"}
                                            isPain={key === "pain"}
                                        />
                                        <input
                                            type="hidden"
                                            name={`pre_mood_${key}`}
                                            value={preMoodValues[key as keyof typeof preMoodValues]}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="environment" className="text-sm font-medium">
                                        Environment
                                    </Label>
                                    <Select name="environment">
                                        <SelectTrigger className="bg-card border-border focus:ring-primary">
                                            <SelectValue placeholder="Where are you?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ENVIRONMENTS).map(([id, config]) => (
                                                <SelectItem key={id} value={id}>
                                                    {config.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="activity" className="text-sm font-medium">
                                        Activity
                                    </Label>
                                    <Select name="activity">
                                        <SelectTrigger className="bg-card border-border focus:ring-primary">
                                            <SelectValue placeholder="What are you doing?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ACTIVITIES).map(([id, config]) => (
                                                <SelectItem key={id} value={id}>
                                                    {config.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mood_notes" className="text-sm font-medium">
                                    Notes (optional)
                                </Label>
                                <Textarea
                                    id="mood_notes"
                                    name="mood_notes"
                                    placeholder="How are you feeling? Any specific thoughts or circumstances..."
                                    rows={2}
                                    className="bg-card border-border focus:ring-primary resize-none"
                                />
                            </div>

                            <SubmitButton />
                        </form>
                    </CardContent>
                )}
            </Card>

            {/* Post-Consumption Mood Form */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Update Post-Consumption Mood</CardTitle>
                            <CardDescription>Record how you feel after the effects</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setShowPostMoodForm(!showPostMoodForm)} className="shrink-0">
                            {showPostMoodForm ? "Cancel" : "Update Mood"}
                        </Button>
                    </div>
                </CardHeader>
                {showPostMoodForm && (
                    <CardContent>
                        <form action={postMoodAction} className="space-y-6">
                            {postMoodState?.error && (
                                <div className="bg-destructive/10 border border-destructive/50 text-destructive px-3 py-2 rounded-md text-sm">
                                    {postMoodState.error}
                                </div>
                            )}

                            {postMoodState?.success && (
                                <div className="bg-primary/10 border border-primary/50 text-primary px-3 py-2 rounded-md text-sm">
                                    {postMoodState.success}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="mood_tracking_id" className="text-sm font-medium">
                                    Select Session to Update
                                </Label>
                                <Select
                                    name="mood_tracking_id"
                                    value={selectedMoodTracking}
                                    onValueChange={setSelectedMoodTracking}
                                    required
                                >
                                    <SelectTrigger className="bg-card border-border focus:ring-primary">
                                        <SelectValue placeholder="Choose a session to update" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {incompleteMoodEntries.map((mood) => (
                                            <SelectItem key={mood.id} value={mood.id}>
                                                {mood.consumption_entries.product_name} -{" "}
                                                {format(parseISO(mood.consumption_entries.consumed_at), "MMM dd, h:mm a")}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-medium">How do you feel now?</h3>

                                {Object.entries(MOOD_CATEGORIES).map(([key, config]) => (
                                    <div key={key}>
                                        <MoodSlider
                                            category={config.label}
                                            value={postMoodValues[key as keyof typeof postMoodValues]}
                                            onChange={(value) => setPostMoodValues((prev) => ({ ...prev, [key]: value }))}
                                            isStress={key === "stress"}
                                            isAnxiety={key === "anxiety"}
                                            isPain={key === "pain"}
                                        />
                                        <input
                                            type="hidden"
                                            name={`post_mood_${key}`}
                                            value={postMoodValues[key as keyof typeof postMoodValues]}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="effects_onset_minutes" className="text-sm font-medium">
                                        Onset Time (minutes)
                                    </Label>
                                    <Input
                                        id="effects_onset_minutes"
                                        name="effects_onset_minutes"
                                        type="number"
                                        min="0"
                                        placeholder="15"
                                        className="bg-card border-border focus:ring-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="effects_duration_minutes" className="text-sm font-medium">
                                        Duration (minutes)
                                    </Label>
                                    <Input
                                        id="effects_duration_minutes"
                                        name="effects_duration_minutes"
                                        type="number"
                                        min="0"
                                        placeholder="120"
                                        className="bg-card border-border focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Effects Intensity</Label>
                                <div className="space-y-2">
                                    <Slider
                                        value={[effectsIntensity]}
                                        onValueChange={(values) => setEffectsIntensity(values[0])}
                                        max={10}
                                        min={1}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>1 - Barely noticeable</span>
                                        <span className="font-medium">{effectsIntensity}/10</span>
                                        <span>10 - Very intense</span>
                                    </div>
                                </div>
                                <input type="hidden" name="effects_intensity" value={effectsIntensity} />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Overall Experience Rating</Label>
                                <div className="flex items-center gap-2">
                                    <StarRating rating={experienceRating} onRatingChange={setExperienceRating} />
                                    <span className="text-sm text-muted-foreground">
                                        {experienceRating > 0 ? `${experienceRating}/5` : "Rate your experience"}
                                    </span>
                                </div>
                                <input type="hidden" name="experience_rating" value={experienceRating || ""} />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Side Effects (select all that apply)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(COMMON_SIDE_EFFECTS).map(([id, config]) => (
                                        <div key={id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={id}
                                                checked={selectedSideEffects.includes(id)}
                                                onCheckedChange={(checked) => handleSideEffectChange(id, checked as boolean)}
                                            />
                                            <label htmlFor={id} className="text-sm">
                                                {config.label}
                                            </label>
                                            {selectedSideEffects.includes(id) && (
                                                <input type="hidden" name="side_effects" value={id} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mood_notes" className="text-sm font-medium">
                                    Experience Notes (optional)
                                </Label>
                                <Textarea
                                    id="mood_notes"
                                    name="mood_notes"
                                    placeholder="How was the experience? Any specific effects, thoughts, or observations..."
                                    rows={3}
                                    className="bg-card border-border focus:ring-primary resize-none"
                                />
                            </div>

                            <SubmitButton isUpdate />
                        </form>
                    </CardContent>
                )}
            </Card>

            {/* Recent Mood Entries */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Mood Tracking
                    </CardTitle>
                    <CardDescription>Your latest mood tracking entries</CardDescription>
                </CardHeader>
                <CardContent>
                    {moodData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No mood data yet.</p>
                            <p className="text-sm">Start tracking to see correlations between strains and your mood!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {moodData.slice(0, 5).map((mood) => (
                                <div
                                    key={mood.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium">{mood.consumption_entries.product_name}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {mood.consumption_entries.consumption_method}
                                            </Badge>
                                            {mood.post_mood_energy ? (
                                                <Badge variant="default" className="text-xs">
                                                    Complete
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {format(parseISO(mood.consumption_entries.consumed_at), "MMM dd, yyyy 'at' h:mm a")}
                                        </div>
                                        {mood.post_mood_energy && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Mood changes: Energy {mood.post_mood_energy - mood.pre_mood_energy > 0 ? "+" : ""}
                                                {mood.post_mood_energy - mood.pre_mood_energy}, Happiness{" "}
                                                {mood.post_mood_happiness! - mood.pre_mood_happiness > 0 ? "+" : ""}
                                                {mood.post_mood_happiness! - mood.pre_mood_happiness}
                                            </div>
                                        )}
                                        {mood.mood_notes && (
                                            <div className="text-xs text-muted-foreground mt-1 italic">"{mood.mood_notes}"</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
