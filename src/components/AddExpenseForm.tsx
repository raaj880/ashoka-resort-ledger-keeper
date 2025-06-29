import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, Save } from "lucide-react";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatDateForInput, validatePrice, normalizeExpenseCategory } from "@/lib/utils";

interface TransactionInput {
  type: 'income' | 'expense';
  source?: string;
  category?: string;
  amount: number;
  date: string;
  note?: string;
}

interface AddExpenseFormProps {
  onAddTransaction: (transaction: TransactionInput) => void;
}

const AddExpenseForm = ({ onAddTransaction }: AddExpenseFormProps) => {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validatePrice(amount)) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setIsSubmitting(true);

    const transaction: TransactionInput = {
      type: 'expense',
      category: normalizeExpenseCategory(category),
      amount: parseFloat(amount),
      date,
      note: note.trim() || undefined
    };

    try {
      await onAddTransaction(transaction);
      
      // Reset form
      setCategory("");
      setAmount("");
      setDate(formatDateForInput(new Date()));
      setNote("");
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-red-50">
        <CardTitle className="flex items-center text-red-700">
          <TrendingDown className="w-5 h-5 mr-2" />
          Add Expense Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-700">Expense Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select expense category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {EXPENSE_CATEGORIES.map(categoryOption => (
                    <SelectItem key={categoryOption} value={categoryOption}>
                      {categoryOption === 'Groceries' && '🛒'} 
                      {categoryOption === 'Staff Salary' && '👥'} 
                      {categoryOption === 'Purchases' && '🛍️'} 
                      {categoryOption === 'Electricity' && '⚡'} 
                      {categoryOption === 'Maintenance' && '🔧'} 
                      {categoryOption === 'Marketing' && '📢'} 
                      {categoryOption === 'Transportation' && '🚗'} 
                      {categoryOption === 'Miscellaneous' && '📝'} 
                      {' '}{categoryOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-700">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-12 text-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-700">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-gray-700">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional details..."
              className="min-h-20"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Adding..." : "Add Expense Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddExpenseForm;