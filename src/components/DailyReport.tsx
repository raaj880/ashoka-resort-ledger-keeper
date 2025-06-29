
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<'transactions'>;

interface DailyReportProps {
  transactions: Transaction[];
}

const DailyReport = ({ transactions }: DailyReportProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredTransactions = transactions.filter(t => t.date === selectedDate);
  
  const dailyIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const dailyExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const dailyProfit = dailyIncome - dailyExpenses;

  // Group income by source
  const incomeBySource = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      if (t.source) {
        acc[t.source] = (acc[t.source] || 0) + Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

  // Group expenses by category
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (t.category) {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Daily Report
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="reportDate" className="text-gray-700">Select Date</Label>
            <Input
              id="reportDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-12 mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Total Income</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(dailyIncome)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(dailyExpenses)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${dailyProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${dailyProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} text-sm font-medium`}>Net Result</p>
                <p className={`text-2xl font-bold ${dailyProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(dailyProfit)}
                </p>
                <Badge 
                  variant={dailyProfit >= 0 ? "secondary" : "destructive"} 
                  className="mt-1"
                >
                  {dailyProfit >= 0 ? "Profit" : "Loss"}
                </Badge>
              </div>
              <FileText className={`w-8 h-8 ${dailyProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-emerald-700">Income by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(incomeBySource).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(incomeBySource).map(([source, amount]) => (
                  <div key={source} className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium text-gray-700">{source}</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <Separator className="my-3" />
                <div className="flex justify-between items-center p-3 bg-emerald-100 rounded-lg">
                  <span className="font-bold text-gray-800">Total Income</span>
                  <span className="font-bold text-emerald-700 text-lg">{formatCurrency(dailyIncome)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No income recorded for this date</p>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-700">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(expensesByCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-gray-700">{category}</span>
                    <span className="font-bold text-red-600">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <Separator className="my-3" />
                <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
                  <span className="font-bold text-gray-800">Total Expenses</span>
                  <span className="font-bold text-red-700 text-lg">{formatCurrency(dailyExpenses)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No expenses recorded for this date</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyReport;
