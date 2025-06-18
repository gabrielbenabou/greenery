"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { convertToConsumable, getRawProducts, getConsumables } from "@/lib/consumption-actions"
import { CONSUMABLE_TYPES, type RawProduct, type Consumable, type ConsumableType } from "@/lib/types"
import { ArrowRight, Package2, Loader2, Zap } from "lucide-react"

export default function ConversionManager() {
  const [convertState, convertAction, isConverting] = useActionState(convertToConsumable, null)
  const [rawProducts, setRawProducts] = useState<RawProduct[]>([])
  const [consumables, setConsumables] = useState<Consumable[]>([])
  const [selectedRawProduct, setSelectedRawProduct] = useState<string>("")
  const [selectedConsumableType, setSelectedConsumableType] = useState<ConsumableType>("Joints")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [rawResult, consumableResult] = await Promise.all([getRawProducts(), getConsumables()])

        if (!rawResult.error && rawResult.data) {
          setRawProducts(rawResult.data.filter((p) => Number(p.current_amount) > 0))
        }

        if (!consumableResult.error && consumableResult.data) {
          setConsumables(consumableResult.data)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [convertState])

  const selectedRawProductData = rawProducts.find((p) => p.id === selectedRawProduct)
  const defaultWeight = CONSUMABLE_TYPES[selectedConsumableType]?.defaultWeight || 0.6

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Conversion Manager
        </CardTitle>
        <CardDescription>Convert raw products into consumables</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="convert" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="convert">Convert</TabsTrigger>
            <TabsTrigger value="consumables">Consumables</TabsTrigger>
          </TabsList>

          <TabsContent value="convert" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading products...</span>
              </div>
            ) : rawProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No raw products available for conversion.</p>
                <p className="text-sm">Add some raw products first!</p>
              </div>
            ) : (
              <form action={convertAction} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="raw_product_id">Raw Product *</Label>
                    <Select
                      name="raw_product_id"
                      value={selectedRawProduct}
                      onValueChange={setSelectedRawProduct}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select raw product" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.strain_name} ({product.current_amount}g available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consumable_type">Consumable Type *</Label>
                    <Select
                      name="consumable_type"
                      value={selectedConsumableType}
                      onValueChange={(value) => setSelectedConsumableType(value as ConsumableType)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONSUMABLE_TYPES).map(([key, type]) => (
                          <SelectItem key={key} value={key}>
                            {type.label} (default: {type.defaultWeight}g each)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Consumable Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder={`${selectedRawProductData?.strain_name || "Custom"} ${selectedConsumableType}`}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="units_to_create">Units to Create *</Label>
                    <Input
                      id="units_to_create"
                      name="units_to_create"
                      type="number"
                      min="1"
                      defaultValue="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grams_per_unit">Grams per Unit *</Label>
                    <Input
                      id="grams_per_unit"
                      name="grams_per_unit"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue={defaultWeight}
                      key={selectedConsumableType} // Reset when type changes
                      required
                    />
                  </div>
                </div>

                {selectedRawProductData && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Selected Product:</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Strain:</span> {selectedRawProductData.strain_name}
                      </div>
                      <div>
                        <span className="font-medium">Available:</span> {selectedRawProductData.current_amount}g
                      </div>
                      {selectedRawProductData.thc_content && (
                        <div>
                          <span className="font-medium">THC:</span> {selectedRawProductData.thc_content}%
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Conversion Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Any notes about this conversion..." rows={2} />
                </div>

                <Button type="submit" disabled={isConverting || !selectedRawProduct} className="w-full">
                  {isConverting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Convert to Consumable
                    </>
                  )}
                </Button>

                {convertState?.error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                    {convertState.error}
                  </div>
                )}

                {convertState?.success && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                    {convertState.success}
                  </div>
                )}
              </form>
            )}
          </TabsContent>

          <TabsContent value="consumables" className="space-y-4">
            {consumables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No consumables created yet.</p>
                <p className="text-sm">Convert some raw products to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consumables.map((consumable) => (
                  <Card key={consumable.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{consumable.name}</h3>
                            <Badge variant="secondary">{consumable.consumable_type}</Badge>
                            {consumable.thc_content && <Badge variant="outline">{consumable.thc_content}% THC</Badge>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Quantity:</span> {consumable.quantity} units
                            </div>
                            <div>
                              <span className="font-medium">Per Unit:</span> {consumable.grams_per_unit}g
                            </div>
                            <div>
                              <span className="font-medium">Total:</span>{" "}
                              {(consumable.quantity * consumable.grams_per_unit).toFixed(1)}g
                            </div>
                            {consumable.source_strain && (
                              <div>
                                <span className="font-medium">Source:</span> {consumable.source_strain}
                              </div>
                            )}
                          </div>
                          {consumable.notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">"{consumable.notes}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {consumable.quantity > 0 ? "In Stock" : "Empty"}
                          </div>
                          <div className="text-xs text-muted-foreground">{consumable.quantity} remaining</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
