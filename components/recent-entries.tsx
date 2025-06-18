"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CONSUMPTION_METHODS, type ConsumptionEntry } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { Clock, Package, Star, Zap } from "lucide-react"

interface RecentEntriesProps {
  entries: ConsumptionEntry[]
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  )
}

function EfficiencyBadge({ method, amount }: { method: string; amount: number }) {
  const methodConfig = CONSUMPTION_METHODS[method as keyof typeof CONSUMPTION_METHODS]
  if (!methodConfig) return null

  const effectiveAmount = amount * methodConfig.efficiency
  const efficiency = Math.round(methodConfig.efficiency * 100)

  return (
    <Badge variant="outline" className="text-xs flex items-center gap-1">
      <Zap className="h-3 w-3" />
      {effectiveAmount.toFixed(2)}g effective ({efficiency}%)
    </Badge>
  )
}

export default function RecentEntries({ entries }: RecentEntriesProps) {
  const recentEntries = entries.slice(0, 10)

  if (recentEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Sessions
          </CardTitle>
          <CardDescription>Your latest consumption records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sessions tracked yet.</p>
            <p className="text-sm">Start tracking to see your data here!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Sessions
        </CardTitle>
        <CardDescription>Your latest consumption records with efficiency data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-medium text-foreground">{entry.product_name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {Number(entry.amount).toFixed(2)}g
                  </Badge>
                  {entry.units_consumed && entry.units_consumed > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {entry.units_consumed} units
                    </Badge>
                  )}
                  {entry.consumption_method && (
                    <Badge variant="outline" className="text-xs">
                      {entry.consumption_method}
                    </Badge>
                  )}
                  {entry.consumption_method && (
                    <EfficiencyBadge method={entry.consumption_method} amount={Number(entry.amount)} />
                  )}
                  {entry.rating && (
                    <div className="flex items-center gap-1">
                      <StarDisplay rating={entry.rating} />
                      <span className="text-xs text-muted-foreground">({entry.rating}/5)</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(parseISO(entry.consumed_at), "MMM dd, yyyy 'at' h:mm a")}
                </div>
                {entry.notes && <div className="text-xs text-muted-foreground mt-1 italic">"{entry.notes}"</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
