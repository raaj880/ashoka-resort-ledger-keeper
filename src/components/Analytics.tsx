
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  source?: string;
  category?: string;
  amount: number;
  date: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics = ({ transactions }: AnalyticsProps) => {
  const [period, setPeriod] = useState("7");

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(period));

  // Filter transactions by period
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  // Daily data for line chart
  const dailyData = [];
  for (let i = 0; i < parseInt(period); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayTransactions = filteredTransactions.filter(t => t.date === dateStr);
    const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    dailyData.unshift({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      income,
      expenses,
      profit: income - expenses
    });
  }

  // Income by source
  const incomeBySource = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.source!] = (acc[t.source!] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const incomeData = Object.entries(incomeBySource).map(([source, amount]) => ({
    name: source,
    value: amount
  }));

  // Expenses by category
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category!] = (acc[t.category!] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const expenseData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  // Calculate totals
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalProfit = totalIncome - totalExpenses;

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Analytics & Trends
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Summary for selected period */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-emerald-600 text-sm font-medium">Total Income</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`${totalProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardContent className="p-6">
            <div className="text-center">
              <p className={`${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} text-sm font-medium`}>Net Profit</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {formatCurrency(totalProfit)}
              </p>
              <Badge 
                variant={totalProfit >= 0 ? "secondary" : "destructive"} 
                className="mt-1"
              >
                {totalProfit >= 0 ? "Profitable" : "Loss"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Daily Income vs Expenses Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  formatter={(value, name) => [`₹${value}`, name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Profit']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name="income" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name="expenses" />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Sources */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-emerald-700">Income by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No income data available</p>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-700">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No expense data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
