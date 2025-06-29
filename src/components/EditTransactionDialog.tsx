
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<'transactions'>;

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditTransactionDialog = ({ transaction, open, onClose, onUpdate }: EditTransactionDialogProps) => {
  const [formData, setFormData] = useState({
    amount: transaction.amount.toString(),
    date: transaction.date,
    note: transaction.note || "",
    source: transaction.source || "",
    category: transaction.category || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      amount: transaction.amount.toString(),
      date: transaction.date,
      note: transaction.note || "",
      source: transaction.source || "",
      category: transaction.category || ""
    });
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        amount: parseFloat(formData.amount),
        date: formData.date,
        note: formData.note.trim() || null,
      };

      if (transaction.type === 'income') {
        updateData.source = formData.source || null;
      } else {
        updateData.category = formData.category || null;
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id);

      if (error) {
        toast.error("Failed to update transaction");
        return;
      }

      toast.success("Transaction updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("An error occurred while updating the transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Transaction
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          {transaction.type === 'income' ? (
            <div>
              <Label htmlFor="source">Income Source</Label>
              <Select 
                value={formData.source} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rooms">🏠 Rooms</SelectItem>
                  <SelectItem value="Restaurant">🍽️ Restaurant</SelectItem>
                  <SelectItem value="Pool">🏊 Pool</SelectItem>
                  <SelectItem value="Café">☕ Café</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="category">Expense Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expense category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Groceries">🛒 Groceries</SelectItem>
                  <SelectItem value="Staff Salary">👥 Staff Salary</SelectItem>
                  <SelectItem value="Purchases">🛍️ Purchases</SelectItem>
                  <SelectItem value="Electricity">⚡ Electricity</SelectItem>
                  <SelectItem value="Maintenance">🔧 Maintenance</SelectItem>
                  <SelectItem value="Marketing">📢 Marketing</SelectItem>
                  <SelectItem value="Transportation">🚗 Transportation</SelectItem>
                  <SelectItem value="Miscellaneous">📝 Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Add any additional details..."
              className="min-h-20"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Updating..." : "Update Transaction"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;
