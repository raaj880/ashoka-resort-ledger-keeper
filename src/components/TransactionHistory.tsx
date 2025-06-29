
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import EditTransactionDialog from "./EditTransactionDialog";

type Transaction = Tables<'transactions'>;

interface TransactionHistoryProps {
  transactions: Transaction[];
  onTransactionUpdate: () => void;
}

const TransactionHistory = ({ transactions, onTransactionUpdate }: TransactionHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Advanced filtering logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesSource = sourceFilter === "all" || transaction.source === sourceFilter;
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;

      let matchesDate = true;
      if (dateFilter !== "all") {
        const transactionDate = new Date(transaction.date);
        const today = new Date();
        
        switch (dateFilter) {
          case "today":
            matchesDate = transactionDate.toDateString() === today.toDateString();
            break;
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = transactionDate >= weekAgo;
            break;
          case "month":
            matchesDate = transactionDate.getMonth() === today.getMonth() && 
                         transactionDate.getFullYear() === today.getFullYear();
            break;
        }
      }

      return matchesSearch && matchesType && matchesSource && matchesCategory && matchesDate;
    });
  }, [transactions, searchTerm, typeFilter, sourceFilter, categoryFilter, dateFilter]);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Failed to delete transaction");
        return;
      }

      toast.success("Transaction deleted successfully");
      onTransactionUpdate();
    } catch (error) {
      toast.error("An error occurred while deleting the transaction");
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Source/Category", "Amount", "Note"];
    const csvData = filteredTransactions.map(t => [
      t.date,
      t.type,
      t.source || t.category || "",
      t.amount,
      t.note || ""
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Transactions exported successfully");
  };

  // Get unique values for filters
  const uniqueSources = [...new Set(transactions.filter(t => t.source).map(t => t.source))];
  const uniqueCategories = [...new Set(transactions.filter(t => t.category).map(t => t.category))];

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Transaction History & Filters
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source!}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category!}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Badge variant="outline" className="text-sm">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setSourceFilter("all");
                setCategoryFilter("all");
                setDateFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found matching your filters
              </div>
            ) : (
              filteredTransactions.slice(0, 50).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? 
                        <TrendingUp className="w-5 h-5 text-emerald-600" /> : 
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <div className="font-medium">
                        {transaction.source || transaction.category}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(transaction.date).toLocaleDateString()}
                        {transaction.note && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="truncate max-w-xs">{transaction.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {filteredTransactions.length > 50 && (
              <div className="text-center py-4 text-gray-500">
                Showing first 50 results. Use filters to refine your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onUpdate={onTransactionUpdate}
        />
      )}
    </div>
  );
};

export default TransactionHistory;
