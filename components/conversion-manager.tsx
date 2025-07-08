"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { archiveConsumable, convertToConsumable, deleteConsumable, editConsumable, getConsumables, getRawProducts } from "@/lib/consumption-actions"
import { CONSUMABLE_TYPES, type Consumable, type ConsumableType, type RawProduct } from "@/lib/types"
import { AlertTriangle, Archive, ArrowRight, Edit, Loader2, Package2, Trash2, Zap } from "lucide-react"
import { useActionState, useEffect, useState } from "react"

export default function ConversionManager() {
    const [convertState, convertAction, isConverting] = useActionState(convertToConsumable, null)
    const [editState, editAction, isEditing] = useActionState(editConsumable, null)
    const [deleteState, deleteAction, isDeleting] = useActionState(deleteConsumable, null)
    const [archiveState, archiveAction, isArchiving] = useActionState(archiveConsumable, null)

    const [rawProducts, setRawProducts] = useState<RawProduct[]>([])
    const [consumables, setConsumables] = useState<Consumable[]>([])
    const [selectedRawProduct, setSelectedRawProduct] = useState<string>("")
    const [selectedConsumableType, setSelectedConsumableType] = useState<ConsumableType>("Joints")
    const [isLoading, setIsLoading] = useState(true)

    // Edit/Delete/Archive states
    const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null)
    const [deletingConsumable, setDeletingConsumable] = useState<Consumable | null>(null)
    const [archivingConsumable, setArchivingConsumable] = useState<Consumable | null>(null)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showArchiveDialog, setShowArchiveDialog] = useState(false)

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
    }, [convertState, editState, deleteState, archiveState])

    // Handle edit form submission
    const handleEditConsumable = (consumable: Consumable) => {
        setEditingConsumable(consumable)
        setShowEditDialog(true)
    }

    // Handle delete confirmation
    const handleDeleteConsumable = (consumable: Consumable) => {
        setDeletingConsumable(consumable)
        setShowDeleteDialog(true)
    }

    // Handle archive confirmation
    const handleArchiveConsumable = (consumable: Consumable) => {
        setArchivingConsumable(consumable)
        setShowArchiveDialog(true)
    }

    // Close dialogs on successful operations
    useEffect(() => {
        if (editState?.success) {
            setShowEditDialog(false)
            setEditingConsumable(null)
        }
    }, [editState?.success])

    useEffect(() => {
        if (deleteState?.success) {
            setShowDeleteDialog(false)
            setDeletingConsumable(null)
        }
    }, [deleteState?.success])

    useEffect(() => {
        if (archiveState?.success) {
            setShowArchiveDialog(false)
            setArchivingConsumable(null)
        }
    }, [archiveState?.success])

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
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="text-right">
                                                        <div className="text-lg font-semibold text-green-600">
                                                            {consumable.quantity > 0 ? "In Stock" : "Empty"}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{consumable.quantity} remaining</div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditConsumable(consumable)}
                                                            disabled={isEditing}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleArchiveConsumable(consumable)}
                                                            disabled={isArchiving}
                                                        >
                                                            <Archive className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDeleteConsumable(consumable)}
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
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

            {/* Edit Consumable Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Consumable</DialogTitle>
                        <DialogDescription>
                            Update the details of your consumable.
                        </DialogDescription>
                    </DialogHeader>
                    {editingConsumable && (
                        <form action={editAction} className="space-y-4">
                            <input type="hidden" name="consumable_id" value={editingConsumable.id} />

                            <div className="space-y-2">
                                <Label htmlFor="edit_name">Name</Label>
                                <Input
                                    id="edit_name"
                                    name="name"
                                    defaultValue={editingConsumable.name}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_type">Type</Label>
                                <Select name="type" defaultValue={editingConsumable.consumable_type} required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CONSUMABLE_TYPES).map(([key, type]) => (
                                            <SelectItem key={key} value={key}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_remaining_units">Quantity</Label>
                                    <Input
                                        id="edit_remaining_units"
                                        name="remaining_units"
                                        type="number"
                                        min="0"
                                        defaultValue={editingConsumable.quantity}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit_weight_per_unit">Grams per Unit</Label>
                                    <Input
                                        id="edit_weight_per_unit"
                                        name="weight_per_unit"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        defaultValue={editingConsumable.grams_per_unit}
                                        required
                                    />
                                </div>
                            </div>

                            {editState?.error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                    {editState.error}
                                </div>
                            )}

                            {editState?.success && (
                                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                                    {editState.success}
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowEditDialog(false)}
                                    disabled={isEditing}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isEditing}>
                                    {isEditing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Update
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Consumable Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Consumable</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this consumable? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingConsumable && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 text-red-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="font-medium">{deletingConsumable.name}</span>
                                </div>
                                <p className="text-sm text-red-600 mt-1">
                                    {deletingConsumable.quantity} units ({(deletingConsumable.quantity * deletingConsumable.grams_per_unit).toFixed(1)}g total)
                                </p>
                            </div>

                            {deleteState?.error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                    {deleteState.error}
                                </div>
                            )}

                            {deleteState?.success && (
                                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                                    {deleteState.success}
                                </div>
                            )}

                            <form action={deleteAction} className="flex justify-end gap-3">
                                <input type="hidden" name="consumable_id" value={deletingConsumable.id} />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowDeleteDialog(false)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="destructive" disabled={isDeleting}>
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Archive Consumable Dialog */}
            <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Archive Consumable</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to archive this consumable? You can unarchive it later if needed.
                        </DialogDescription>
                    </DialogHeader>
                    {archivingConsumable && (
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center gap-2 text-orange-800">
                                    <Archive className="h-4 w-4" />
                                    <span className="font-medium">{archivingConsumable.name}</span>
                                </div>
                                <p className="text-sm text-orange-600 mt-1">
                                    {archivingConsumable.quantity} units ({(archivingConsumable.quantity * archivingConsumable.grams_per_unit).toFixed(1)}g total)
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                    Archiving will hide this consumable from the main list but preserve all consumption history.
                                </p>
                            </div>

                            {archiveState?.error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                    {archiveState.error}
                                </div>
                            )}

                            {archiveState?.success && (
                                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                                    {archiveState.success}
                                </div>
                            )}

                            <form action={archiveAction} className="flex justify-end gap-3">
                                <input type="hidden" name="consumable_id" value={archivingConsumable.id} />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowArchiveDialog(false)}
                                    disabled={isArchiving}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isArchiving}>
                                    {isArchiving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Archiving...
                                        </>
                                    ) : (
                                        <>
                                            <Archive className="mr-2 h-4 w-4" />
                                            Archive
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    )
}
