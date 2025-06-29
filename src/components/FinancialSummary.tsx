import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Target,
  AlertTriangle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line } from 'recharts';
import { formatCurrency } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<'transactions'>;

interface FinancialSummaryProps {
  transactions: Transaction[];
  onNavigateToTab: (tab: string) => void;
}

interface FinancialData {
  dailyTotals: Array<{
    date: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
  monthlyComparison: Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
  incomeBreakdown: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  expenseBreakdown: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    averageDailyRevenue: number;
    growthRate: number;
  };
}

const FinancialSummary = ({ transactions, onNavigateToTab }: FinancialSummaryProps) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [financialData, setFinancialData] = useState<FinancialData>({
    dailyTotals: [],
    monthlyComparison: [],
    incomeBreakdown: [],
    expenseBreakdown: [],
    kpis: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      averageDailyRevenue: 0,
      growthRate: 0
    }
  });

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

  useEffect(() => {
    calculateFinancialData();
  }, [transactions, timeRange]);

  const calculateFinancialData = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const filteredTransactions = transactions.filter(t => 
      new Date(t.date) >= startDate
    );

    // Calculate daily totals
    const dailyTotals = calculateDailyTotals(filteredTransactions);
    
    // Calculate monthly comparison
    const monthlyComparison = calculateMonthlyComparison(filteredTransactions);
    
    // Calculate income breakdown
    const incomeBreakdown = calculateIncomeBreakdown(filteredTransactions);
    
    // Calculate expense breakdown
    const expenseBreakdown = calculateExpenseBreakdown(filteredTransactions);
    
    // Calculate KPIs
    const kpis = calculateKPIs(filteredTransactions, dailyTotals);

    setFinancialData({
      dailyTotals,
      monthlyComparison,
      incomeBreakdown,
      expenseBreakdown,
      kpis
    });
  };

  const calculateDailyTotals = (transactions: Transaction[]) => {
    const dailyMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(t => {
      const date = t.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { income: 0, expenses: 0 });
      }
      
      const day = dailyMap.get(date)!;
      if (t.type === 'income') {
        day.income += Number(t.amount);
      } else {
        day.expenses += Number(t.amount);
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const calculateMonthlyComparison = (transactions: Transaction[]) => {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expenses: 0 });
      }
      
      const month = monthlyMap.get(monthKey)!;
      if (t.type === 'income') {
        month.income += Number(t.amount);
      } else {
        month.expenses += Number(t.amount);
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
          month: monthName,
          income: data.income,
          expenses: data.expenses,
          profit: data.income - data.expenses
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateIncomeBreakdown = (transactions: Transaction[]) => {
    const incomeMap = new Map<string, number>();
    let totalIncome = 0;

    transactions
      .filter(t => t.type === 'income' && t.source)
      .forEach(t => {
        const source = t.source!;
        incomeMap.set(source, (incomeMap.get(source) || 0) + Number(t.amount));
        totalIncome += Number(t.amount);
      });

    return Array.from(incomeMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalIncome > 0 ? (value / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  };

  const calculateExpenseBreakdown = (transactions: Transaction[]) => {
    const expenseMap = new Map<string, number>();
    let totalExpenses = 0;

    transactions
      .filter(t => t.type === 'expense' && t.category)
      .forEach(t => {
        const category = t.category!;
        expenseMap.set(category, (expenseMap.get(category) || 0) + Number(t.amount));
        totalExpenses += Number(t.amount);
      });

    return Array.from(expenseMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  };

  const calculateKPIs = (transactions: Transaction[], dailyTotals: any[]) => {
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const averageDailyRevenue = dailyTotals.length > 0 
      ? totalRevenue / dailyTotals.length 
      : 0;

    // Calculate growth rate (compare first half vs second half of period)
    const midPoint = Math.floor(dailyTotals.length / 2);
    const firstHalf = dailyTotals.slice(0, midPoint);
    const secondHalf = dailyTotals.slice(midPoint);
    
    const firstHalfRevenue = firstHalf.reduce((sum, day) => sum + day.income, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, day) => sum + day.income, 0);
    
    const growthRate = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      averageDailyRevenue,
      growthRate
    };
  };

  const exportFinancialReport = () => {
    const reportData = {
      period: timeRange,
      kpis: financialData.kpis,
      dailyTotals: financialData.dailyTotals,
      incomeBreakdown: financialData.incomeBreakdown,
      expenseBreakdown: financialData.expenseBreakdown
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-summary-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Financial Summary & Analytics
            </CardTitle>
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportFinancialReport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(financialData.kpis.totalRevenue)}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Avg: {formatCurrency(financialData.kpis.averageDailyRevenue)}/day
                </p>
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
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(financialData.kpis.totalExpenses)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {((financialData.kpis.totalExpenses / financialData.kpis.totalRevenue) * 100).toFixed(1)}% of revenue
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${financialData.kpis.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${financialData.kpis.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} text-sm font-medium`}>
                  Net Profit
                </p>
                <p className={`text-2xl font-bold ${financialData.kpis.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(financialData.kpis.netProfit)}
                </p>
                <p className={`text-xs mt-1 ${financialData.kpis.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {financialData.kpis.profitMargin.toFixed(1)}% margin
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${financialData.kpis.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Growth Rate</p>
                <p className="text-2xl font-bold text-purple-700">
                  {financialData.kpis.growthRate > 0 ? '+' : ''}{financialData.kpis.growthRate.toFixed(1)}%
                </p>
                <div className="flex items-center mt-1">
                  {financialData.kpis.growthRate >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                  )}
                  <p className="text-xs text-purple-600">vs previous period</p>
                </div>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Daily Revenue & Expense Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={financialData.dailyTotals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-emerald-700">Income Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={financialData.incomeBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {financialData.incomeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-700">Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={financialData.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {financialData.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Monthly Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={financialData.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="income" fill="#10B981" name="Income" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Top Income Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.incomeBreakdown.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.expenseBreakdown.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Health Indicators */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Financial Health Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <Badge variant={financialData.kpis.profitMargin >= 20 ? "default" : financialData.kpis.profitMargin >= 10 ? "secondary" : "destructive"}>
                      {financialData.kpis.profitMargin >= 20 ? "Excellent" : financialData.kpis.profitMargin >= 10 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{financialData.kpis.profitMargin.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500 mt-1">Target: 20%+</div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Growth Rate</span>
                    <Badge variant={financialData.kpis.growthRate >= 10 ? "default" : financialData.kpis.growthRate >= 0 ? "secondary" : "destructive"}>
                      {financialData.kpis.growthRate >= 10 ? "Strong" : financialData.kpis.growthRate >= 0 ? "Stable" : "Declining"}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {financialData.kpis.growthRate > 0 ? '+' : ''}{financialData.kpis.growthRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">vs previous period</div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Expense Ratio</span>
                    <Badge variant={
                      (financialData.kpis.totalExpenses / financialData.kpis.totalRevenue) <= 0.7 ? "default" : 
                      (financialData.kpis.totalExpenses / financialData.kpis.totalRevenue) <= 0.8 ? "secondary" : "destructive"
                    }>
                      {(financialData.kpis.totalExpenses / financialData.kpis.totalRevenue) <= 0.7 ? "Efficient" : 
                       (financialData.kpis.totalExpenses / financialData.kpis.totalRevenue) <= 0.8 ? "Moderate" : "High"}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {((financialData.kpis.totalExpenses / financialData.kpis.totalRevenue) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">of revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={() => onNavigateToTab("income")} 
          className="h-16 bg-emerald-600 hover:bg-emerald-700"
        >
          <TrendingUp className="w-5 h-5 mr-2" />
          Add Income Entry
        </Button>
        <Button 
          onClick={() => onNavigateToTab("expense")} 
          variant="outline"
          className="h-16 border-red-200 text-red-600 hover:bg-red-50"
        >
          <TrendingDown className="w-5 h-5 mr-2" />
          Add Expense Entry
        </Button>
        <Button 
          onClick={() => onNavigateToTab("reports")} 
          variant="outline"
          className="h-16"
        >
          <FileText className="w-5 h-5 mr-2" />
          View Detailed Reports
        </Button>
      </div>
    </div>
  );
};

export default FinancialSummary;