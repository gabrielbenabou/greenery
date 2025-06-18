"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Package, Calendar, DollarSign, Clock } from "lucide-react"
import { addInventory, type ProductType, type InventoryItem } from "@/lib/consumption-actions"
import { format, parseISO } from "date-fns"

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
          Add to Inventory
        </>
      )}
    </Button>
  )
}

interface InventoryManagerProps {
  inventory: (InventoryItem & { daysRemaining?: number | null; dailyAverage?: number })[]
}

export default function InventoryManager({ inventory }: InventoryManagerProps) {
  const [state, formAction] = useActionState(addInventory, null)
  const [selectedProduct, setSelectedProduct] = useState<ProductType | "">("")
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Current Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Current Inventory
          </CardTitle>
          <CardDescription>Track your supply and see how long it will last</CardDescription>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inventory items yet.</p>
              <p className="text-sm">Add your first item to start tracking!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground">{item.product_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {Number(item.current_amount).toFixed(2)}g remaining
                      </Badge>
                      {item.daysRemaining && (
                        <Badge
                          variant={
                            item.daysRemaining < 7 ? "destructive" : item.daysRemaining < 14 ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {item.daysRemaining} days left
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Added {format(parseISO(item.purchase_date), "MMM dd, yyyy")}
                        </span>
                        {item.cost && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />${Number(item.cost).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {item.dailyAverage && item.dailyAverage > 0 && (
                        <div className="text-xs">Daily average: {item.dailyAverage}g</div>
                      )}
                      {item.notes && <div className="text-xs italic">"{item.notes}"</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Inventory Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Add Inventory</CardTitle>
              <CardDescription>Add new products to your inventory</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)} className="shrink-0">
              {showAddForm ? "Cancel" : "Add Item"}
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
                  <Label htmlFor="product_name" className="text-sm font-medium">
                    Product Type
                  </Label>
                  <Select
                    name="product_name"
                    value={selectedProduct}
                    onValueChange={(value) => setSelectedProduct(value as ProductType)}
                    required
                  >
                    <SelectTrigger className="bg-card border-border focus:ring-primary">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cartridges">Cartridges</SelectItem>
                      <SelectItem value="Johnnies">Johnnies</SelectItem>
                      <SelectItem value="Grams">Grams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_amount" className="text-sm font-medium">
                    Amount (grams)
                  </Label>
                  <Input
                    id="current_amount"
                    name="current_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="3.5"
                    required
                    className="bg-card border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-sm font-medium">
                    Cost (optional)
                  </Label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="25.00"
                    className="bg-card border-border focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date" className="text-sm font-medium">
                    Purchase Date
                  </Label>
                  <Input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
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
                  placeholder="Strain, source, quality notes..."
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
