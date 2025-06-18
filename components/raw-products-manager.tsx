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
import { addRawProduct, getRawProducts } from "@/lib/consumption-actions"
import { RAW_PRODUCT_TYPES, type RawProduct } from "@/lib/types"
import { Package, Plus, Loader2, Leaf } from "lucide-react"

export default function RawProductsManager() {
  const [addState, addAction, isAddPending] = useActionState(addRawProduct, null)
  const [rawProducts, setRawProducts] = useState<RawProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRawProducts() {
      try {
        const { data, error } = await getRawProducts()
        if (!error && data) {
          setRawProducts(data)
        }
      } catch (error) {
        console.error("Failed to fetch raw products:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRawProducts()
  }, [addState])

  const totalValue = rawProducts.reduce((sum, product) => sum + (Number(product.cost) || 0), 0)
  const totalWeight = rawProducts.reduce((sum, product) => sum + Number(product.current_amount), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Raw Products Manager
        </CardTitle>
        <CardDescription>Manage your raw cannabis inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="add">Add Product</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{rawProducts.length}</div>
                  <p className="text-xs text-muted-foreground">Products</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{totalWeight.toFixed(1)}g</div>
                  <p className="text-xs text-muted-foreground">Total Weight</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </CardContent>
              </Card>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading inventory...</span>
              </div>
            ) : rawProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No raw products in inventory.</p>
                <p className="text-sm">Add some products to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rawProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{product.strain_name}</h3>
                            <Badge variant="secondary">{product.product_type}</Badge>
                            {product.thc_content && <Badge variant="outline">{product.thc_content}% THC</Badge>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Amount:</span> {product.current_amount}g
                            </div>
                            <div>
                              <span className="font-medium">Original:</span> {product.original_amount}g
                            </div>
                            {product.cost && (
                              <div>
                                <span className="font-medium">Cost:</span> ${Number(product.cost).toFixed(2)}
                              </div>
                            )}
                            {product.source && (
                              <div>
                                <span className="font-medium">Source:</span> {product.source}
                              </div>
                            )}
                          </div>
                          {product.quality_notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">"{product.quality_notes}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {((Number(product.current_amount) / Number(product.original_amount)) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">remaining</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <form action={addAction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_type">Product Type *</Label>
                  <Select name="product_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RAW_PRODUCT_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strain_name">Strain/Product Name *</Label>
                  <Input id="strain_name" name="strain_name" placeholder="e.g., Blue Dream, Northern Lights" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_amount">Amount (grams) *</Label>
                  <Input
                    id="current_amount"
                    name="current_amount"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thc_content">THC Content (%)</Label>
                  <Input
                    id="thc_content"
                    name="thc_content"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input id="cost" name="cost" type="number" step="0.01" min="0" placeholder="0.00" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input id="source" name="source" placeholder="Dispensary, friend, etc." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality_notes">Quality Notes</Label>
                <Textarea
                  id="quality_notes"
                  name="quality_notes"
                  placeholder="Appearance, smell, quality observations..."
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isAddPending} className="w-full">
                {isAddPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Product...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Raw Product
                  </>
                )}
              </Button>

              {addState?.error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{addState.error}</div>
              )}

              {addState?.success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                  {addState.success}
                </div>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
