"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteConsumable, deleteRawProduct, editConsumable, editRawProduct } from "@/lib/consumption-actions";
import { CONSUMABLE_TYPES, RAW_PRODUCT_TYPES, type Consumable, type RawProduct } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { AlertTriangle, Calendar, DollarSign, Edit, Package, Trash2, Weight } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";

interface ProductActionsProps {
    product: Consumable | RawProduct;
    type: "consumable" | "raw_product";
}

export default function ProductActions({ product, type }: ProductActionsProps) {
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const isConsumable = type === "consumable";

    // Server actions
    const [editState, editAction] = useActionState(
        isConsumable ? editConsumable : editRawProduct,
        null
    );
    const [deleteState, deleteAction] = useActionState(
        isConsumable ? deleteConsumable : deleteRawProduct,
        null
    );

    // Handle success/error states
    if (editState?.success) {
        toast.success(editState.success);
        setOpenEditDialog(false);
    } else if (editState?.error) {
        toast.error(editState.error);
    }

    if (deleteState?.success) {
        toast.success(deleteState.success);
        setOpenDeleteDialog(false);
    } else if (deleteState?.error) {
        toast.error(deleteState.error);
    }

    const formatDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), "yyyy-MM-dd");
        } catch {
            return dateString;
        }
    };

    const getProductDisplayName = () => {
        if (isConsumable) {
            return (product as Consumable).name;
        } else {
            return (product as RawProduct).strain_name;
        }
    };

    const getProductTypeLabel = () => {
        if (isConsumable) {
            const consumable = product as Consumable;
            return CONSUMABLE_TYPES[consumable.type]?.label || consumable.type;
        } else {
            const rawProduct = product as RawProduct;
            return RAW_PRODUCT_TYPES[rawProduct.product_type]?.label || rawProduct.product_type;
        }
    };

    const getRemainingInfo = () => {
        if (isConsumable) {
            const consumable = product as Consumable;
            return `${consumable.remaining_units}/${consumable.total_units} units`;
        } else {
            const rawProduct = product as RawProduct;
            return `${rawProduct.current_amount}g/${rawProduct.original_amount}g`;
        }
    };

    const isLowStock = () => {
        if (isConsumable) {
            const consumable = product as Consumable;
            return (consumable.remaining_units / consumable.total_units) < 0.2;
        } else {
            const rawProduct = product as RawProduct;
            return (rawProduct.current_amount / rawProduct.original_amount) < 0.2;
        }
    };

    return (
        <div className="flex items-center gap-1">
            {/* Edit Dialog */}
            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit {type.replace('_', ' ')}</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Edit {isConsumable ? "Consumable" : "Raw Product"}
                        </DialogTitle>
                        <DialogDescription>
                            Update the details of your {isConsumable ? "consumable" : "raw product"}.
                        </DialogDescription>
                    </DialogHeader>

                    <form action={editAction} className="space-y-4">
                        <input
                            type="hidden"
                            name={isConsumable ? "consumable_id" : "product_id"}
                            value={product.id}
                        />

                        {isConsumable ? (
                            // Consumable form fields
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Product Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={(product as Consumable).name}
                                            placeholder="e.g., Blue Dream Gummies"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select name="type" defaultValue={(product as Consumable).type}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="total_units">Total Units</Label>
                                        <Input
                                            id="total_units"
                                            name="total_units"
                                            type="number"
                                            min="1"
                                            defaultValue={(product as Consumable).total_units}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="remaining_units">Remaining Units</Label>
                                        <Input
                                            id="remaining_units"
                                            name="remaining_units"
                                            type="number"
                                            min="0"
                                            max={(product as Consumable).total_units}
                                            defaultValue={(product as Consumable).remaining_units}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="weight_per_unit">Weight per Unit (g)</Label>
                                        <Input
                                            id="weight_per_unit"
                                            name="weight_per_unit"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={(product as Consumable).weight_per_unit}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cost_per_unit">Cost per Unit ($)</Label>
                                        <Input
                                            id="cost_per_unit"
                                            name="cost_per_unit"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={(product as Consumable).cost_per_unit}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Raw Product form fields
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="strain_name">Strain Name</Label>
                                        <Input
                                            id="strain_name"
                                            name="strain_name"
                                            defaultValue={(product as RawProduct).strain_name}
                                            placeholder="e.g., Blue Dream"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select name="product_type" defaultValue={(product as RawProduct).product_type}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="purchase_date">Purchase Date</Label>
                                        <Input
                                            id="purchase_date"
                                            name="purchase_date"
                                            type="date"
                                            defaultValue={formatDate((product as RawProduct).purchase_date)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cost">Total Cost ($)</Label>
                                        <Input
                                            id="cost"
                                            name="cost"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={(product as RawProduct).cost}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="total_amount">Total Amount (g)</Label>
                                        <Input
                                            id="total_amount"
                                            name="total_amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={(product as RawProduct).original_amount}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="remaining_amount">Remaining Amount (g)</Label>
                                        <Input
                                            id="remaining_amount"
                                            name="remaining_amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={(product as RawProduct).original_amount}
                                            defaultValue={(product as RawProduct).current_amount}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="thc_content">THC Content (%)</Label>
                                        <Input
                                            id="thc_content"
                                            name="thc_content"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            defaultValue={(product as RawProduct).thc_content || 0}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cbd_content">CBD Content (%)</Label>
                                        <Input
                                            id="cbd_content"
                                            name="cbd_content"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            defaultValue={(product as RawProduct).cbd_content || 0}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="terpene_profile">Terpene Profile</Label>
                                    <Textarea
                                        id="terpene_profile"
                                        name="terpene_profile"
                                        defaultValue={(product as RawProduct).quality_notes || ""}
                                        placeholder="e.g., Myrcene, Limonene, Caryophyllene"
                                        rows={2}
                                    />
                                </div>
                            </>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {type.replace('_', ' ')}</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete {isConsumable ? "Consumable" : "Raw Product"}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this {isConsumable ? "consumable" : "raw product"}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <form action={deleteAction} className="space-y-4">
                        <input
                            type="hidden"
                            name={isConsumable ? "consumable_id" : "product_id"}
                            value={product.id}
                        />

                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="font-medium">{getProductDisplayName()}</h4>
                                    <Badge variant="outline" className="text-xs">
                                        {getProductTypeLabel()}
                                    </Badge>
                                </div>
                                {isLowStock() && (
                                    <Badge variant="destructive" className="text-xs">
                                        Low Stock
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Weight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Remaining:</span>
                                    <span className="font-medium">{getRemainingInfo()}</span>
                                </div>

                                {!isConsumable && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">Purchased:</span>
                                        <span className="font-medium">
                                            {format(parseISO((product as RawProduct).purchase_date), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        {isConsumable ? "Cost/unit:" : "Total cost:"}
                                    </span>
                                    <span className="font-medium">
                                        ${isConsumable
                                            ? (product as Consumable).cost_per_unit.toFixed(2)
                                            : (product as RawProduct).cost?.toFixed(2) || ""
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpenDeleteDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive">
                                Delete {isConsumable ? "Consumable" : "Raw Product"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
