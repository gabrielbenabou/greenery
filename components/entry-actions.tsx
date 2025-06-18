"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteConsumptionEntry, editConsumptionEntry } from "@/lib/consumption-actions";
import { CONSUMPTION_METHODS, type ConsumptionEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";

interface EntryActionsProps {
  entry: ConsumptionEntry;
}

export default function EntryActions({ entry }: EntryActionsProps) {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editState, editAction] = useActionState(editConsumptionEntry, null);
  const [deleteState, deleteAction] = useActionState(deleteConsumptionEntry, null);

  const [formData, setFormData] = useState({
    amount: entry.amount,
    consumption_method: entry.consumption_method,
    notes: entry.notes || "",
    consumed_at: entry.consumed_at,
  });

  // Show success/error toast when form is submitted
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

  const formattedDate = format(parseISO(entry.consumed_at), "yyyy-MM-dd'T'HH:mm");

  return (
    <div className="relative flex items-center">
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit entry</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>Update the details of your consumption entry.</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            <input type="hidden" name="entry_id" value={entry.id} />
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (g)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumption_method">Consumption Method</Label>
              <Select
                name="consumption_method"
                value={formData.consumption_method}
                onValueChange={(value) => setFormData({ ...formData, consumption_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How did you consume?" />
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
                value={formattedDate}
                onChange={(e) => setFormData({ ...formData, consumed_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete entry</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <form action={deleteAction} className="space-y-4">
            <input type="hidden" name="entry_id" value={entry.id} />
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <p>
                <strong>Date:</strong> {format(parseISO(entry.consumed_at), "PPP p")}
              </p>
              <p>
                <strong>Amount:</strong> {entry.amount}g ({CONSUMPTION_METHODS[entry.consumption_method]?.label})
              </p>
              {entry.notes && (
                <p>
                  <strong>Notes:</strong> {entry.notes}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDeleteDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Delete Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}