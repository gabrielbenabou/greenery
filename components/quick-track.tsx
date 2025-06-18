"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { addConsumption, getConsumables } from "@/lib/consumption-actions"
import { CONSUMPTION_METHODS, type ConsumptionMethod, type Consumable } from "@/lib/types"
import { Loader2, Plus } from "lucide-react"

export default function QuickTrack() {
  const [state, formAction, isPending] = useActionState(addConsumption, null)
  const [consumables, setConsumables] = useState<Consumable[]>([])
  const [selectedConsumable, setSelectedConsumable] = useState<string>("")
  const [consumptionMethod, setConsumptionMethod] = useState<ConsumptionMethod>("Smoked")
  const [isLoadingConsumables, setIsLoadingConsumables] = useState(true)

  useEffect(() => {
    async function fetchConsumables() {
      try {
        const { data, error } = await getConsumables()
        if (!error && data) {
          setConsumables(data.filter((c) => c.quantity > 0)) // Only show consumables with stock
        }
      } catch (error) {
        console.error("Failed to fetch consumables:", error)
      } finally {
        setIsLoadingConsumables(false)
      }
    }
    fetchConsumables()
  }, [])

  const selectedConsumableData = consumables.find((c) => c.id === selectedConsumable)
  const maxUnits = selectedConsumableData?.quantity || 0
  const gramsPerUnit = selectedConsumableData?.grams_per_unit || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Track Session
        </CardTitle>
        <CardDescription>Log your consumption session quickly</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consumable_id">Consumable *</Label>
              {isLoadingConsumables ? (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading consumables...</span>
                </div>
              ) : consumables.length === 0 ? (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">
                    No consumables available. Create some from your raw products first.
                  </p>
                  <Button type="button" variant="outline" size="sm">
                    Go to Inventory Manager
                  </Button>
                </div>
              ) : (
                <Select name="consumable_id" value={selectedConsumable} onValueChange={setSelectedConsumable} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a consumable" />
                  </SelectTrigger>
                  <SelectContent>
                    {consumables.map((consumable) => (
                      <SelectItem key={consumable.id} value={consumable.id}>
                        {consumable.name} ({consumable.quantity} left, {consumable.grams_per_unit}g each)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="units_consumed">Units to Consume *</Label>
              <Input
                id="units_consumed"
                name="units_consumed"
                type="number"
                min="1"
                max={maxUnits}
                defaultValue="1"
                required
                disabled={!selectedConsumable}
              />
              {selectedConsumableData && (
                <p className="text-xs text-muted-foreground">
                  Available: {maxUnits} units ({gramsPerUnit}g each)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumption_method">Method *</Label>
              <Select
                name="consumption_method"
                value={consumptionMethod}
                onValueChange={(value) => setConsumptionMethod(value as ConsumptionMethod)}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONSUMPTION_METHODS).map(([key, method]) => (
                    <SelectItem key={key} value={key}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumed_at">Date & Time</Label>
              <Input
                id="consumed_at"
                name="consumed_at"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="How are you feeling? Any specific effects or observations..."
              rows={3}
            />
          </div>

          {/* Hidden fields for compatibility */}
          <input type="hidden" name="product_name" value={selectedConsumableData?.consumable_type || "Joints"} />
          <input type="hidden" name="amount" value={selectedConsumableData ? (gramsPerUnit * 1).toString() : "0.6"} />

          <Button type="submit" disabled={isPending || !selectedConsumable} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tracking Session...
              </>
            ) : (
              "Track Session"
            )}
          </Button>

          {state?.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{state.error}</div>
          )}

          {state?.success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
              {state.success}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
