import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<'transactions'>;

interface PLData {
  revenue: {
    rooms: number;
    restaurant: number;
    pool: number;
    cafe: number;
    total: number;
  };
  expenses: {
    groceries: number;
    staff_salary: number;
    purchases: number;
    electricity: number;
    maintenance: number;
    marketing: number;
    transportation: number;
    miscellaneous: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

const ProfitLossReport = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plData, setPLData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchTransactions();
  }, [reportType, selectedMonth, selectedYear, customStartDate, customEndDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let startDate: string;
      let endDate: string;

      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);

      switch (reportType) {
        case 'monthly':
          startDate = new Date(year, month, 1).toISOString().split('T')[0];
          endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
          break;
        case 'quarterly':
          const quarterStart = Math.floor(month / 3) * 3;
          startDate = new Date(year, quarterStart, 1).toISOString().split('T')[0];
          endDate = new Date(year, quarterStart + 3, 0).toISOString().split('T')[0];
          break;
        case 'yearly':
          startDate = new Date(year, 0, 1).toISOString().split('T')[0];
          endDate = new Date(year, 11, 31).toISOString().split('T')[0];
          break;
        case 'custom':
          if (!customStartDate || !customEndDate) return;
          startDate = customStartDate;
          endDate = customEndDate;
          break;
        default:
          return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transaction data');
        return;
      }

      setTransactions(data || []);
      calculatePLData(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePLData = (transactionData: Transaction[]) => {
    const revenue = {
      rooms: 0,
      restaurant: 0,
      pool: 0,
      cafe: 0,
      total: 0
    };

    const expenses = {
      groceries: 0,
      staff_salary: 0,
      purchases: 0,
      electricity: 0,
      maintenance: 0,
      marketing: 0,
      transportation: 0,
      miscellaneous: 0,
      total: 0
    };

    transactionData.forEach(transaction => {
      const amount = Number(transaction.amount);
      
      if (transaction.type === 'income' && transaction.source) {
        switch (transaction.source.toLowerCase()) {
          case 'rooms':
            revenue.rooms += amount;
            break;
          case 'restaurant':
            revenue.restaurant += amount;
            break;
          case 'pool':
            revenue.pool += amount;
            break;
          case 'café':
          case 'cafe':
            revenue.cafe += amount;
            break;
        }
        revenue.total += amount;
      } else if (transaction.type === 'expense' && transaction.category) {
        const category = transaction.category.toLowerCase().replace(/\s+/g, '_');
        switch (category) {
          case 'groceries':
            expenses.groceries += amount;
            break;
          case 'staff_salary':
            expenses.staff_salary += amount;
            break;
          case 'purchases':
            expenses.purchases += amount;
            break;
          case 'electricity':
            expenses.electricity += amount;
            break;
          case 'maintenance':
            expenses.maintenance += amount;
            break;
          case 'marketing':
            expenses.marketing += amount;
            break;
          case 'transportation':
            expenses.transportation += amount;
            break;
          default:
            expenses.miscellaneous += amount;
            break;
        }
        expenses.total += amount;
      }
    });

    const grossProfit = revenue.total - expenses.total;
    const profitMargin = revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0;

    setPLData({
      revenue,
      expenses,
      grossProfit,
      netProfit: grossProfit, // For now, same as gross profit
      profitMargin
    });
  };

  const exportToPDF = () => {
    if (!plData) return;

    const reportContent = generateReportContent();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-loss-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const generateReportContent = () => {
    if (!plData) return '';

    const reportTitle = `ASHOKA RESORT - PROFIT & LOSS STATEMENT`;
    const period = getPeriodString();
    
    return `
${reportTitle}
${period}
${'='.repeat(50)}

REVENUE:
  Rooms                    ${formatCurrency(plData.revenue.rooms)}
  Restaurant               ${formatCurrency(plData.revenue.restaurant)}
  Pool                     ${formatCurrency(plData.revenue.pool)}
  Café                     ${formatCurrency(plData.revenue.cafe)}
  ${'-'.repeat(40)}
  Total Revenue            ${formatCurrency(plData.revenue.total)}

EXPENSES:
  Groceries                ${formatCurrency(plData.expenses.groceries)}
  Staff Salary             ${formatCurrency(plData.expenses.staff_salary)}
  Purchases                ${formatCurrency(plData.expenses.purchases)}
  Electricity              ${formatCurrency(plData.expenses.electricity)}
  Maintenance              ${formatCurrency(plData.expenses.maintenance)}
  Marketing                ${formatCurrency(plData.expenses.marketing)}
  Transportation           ${formatCurrency(plData.expenses.transportation)}
  Miscellaneous            ${formatCurrency(plData.expenses.miscellaneous)}
  ${'-'.repeat(40)}
  Total Expenses           ${formatCurrency(plData.expenses.total)}

${'='.repeat(50)}
GROSS PROFIT               ${formatCurrency(plData.grossProfit)}
NET PROFIT                 ${formatCurrency(plData.netProfit)}
PROFIT MARGIN              ${plData.profitMargin.toFixed(2)}%
${'='.repeat(50)}

Generated on: ${new Date().toLocaleString()}
    `;
  };

  const getPeriodString = () => {
    switch (reportType) {
      case 'monthly':
        return `${monthNames[parseInt(selectedMonth)]} ${selectedYear}`;
      case 'quarterly':
        const quarter = Math.floor(parseInt(selectedMonth) / 3) + 1;
        return `Q${quarter} ${selectedYear}`;
      case 'yearly':
        return `Year ${selectedYear}`;
      case 'custom':
        return `${customStartDate} to ${customEndDate}`;
      default:
        return '';
    }
  };

  const years = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear()))).sort((a, b) => b - a);
  if (years.length === 0) {
    years.push(new Date().getFullYear());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">Generating profit & loss report...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Profit & Loss Report
            </CardTitle>
            <Button onClick={exportToPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Period</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType !== 'custom' && (
              <>
                {reportType !== 'yearly' && (
                  <div>
                    <Label>Month</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthNames.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {reportType === 'custom' && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-4">
            <Badge variant="outline" className="text-sm">
              Period: {getPeriodString()} | {transactions.length} transactions
            </Badge>
          </div>
        </CardContent>
      </Card>

      {plData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(plData.revenue.total)}
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
                      {formatCurrency(plData.expenses.total)}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className={`${plData.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${plData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} text-sm font-medium`}>
                      Net Profit
                    </p>
                    <p className={`text-2xl font-bold ${plData.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {formatCurrency(plData.netProfit)}
                    </p>
                  </div>
                  <DollarSign className={`w-8 h-8 ${plData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Profit Margin</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {plData.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed P&L Statement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-emerald-700">Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium">🏠 Rooms</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(plData.revenue.rooms)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium">🍽️ Restaurant</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(plData.revenue.restaurant)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium">🏊 Pool</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(plData.revenue.pool)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium">☕ Café</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(plData.revenue.cafe)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-emerald-100 rounded-lg">
                    <span className="font-bold text-gray-800">Total Revenue</span>
                    <span className="font-bold text-emerald-700 text-lg">
                      {formatCurrency(plData.revenue.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-700">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">🛒 Groceries</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(plData.expenses.groceries)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">👥 Staff Salary</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(plData.expenses.staff_salary)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">🛍️ Purchases</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(plData.expenses.purchases)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">⚡ Electricity</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(plData.expenses.electricity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">🔧 Maintenance</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(plData.expenses.maintenance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">📢 Marketing</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(plData.expenses.marketing)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">🚗 Transportation</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(plData.expenses.transportation)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">📝 Miscellaneous</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(plData.expenses.miscellaneous)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
                    <span className="font-bold text-gray-800">Total Expenses</span>
                    <span className="font-bold text-red-700 text-lg">
                      {formatCurrency(plData.expenses.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfitLossReport;