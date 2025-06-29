import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  LogOut,
  Home,
  Utensils,
  Coffee,
  Waves,
  RefreshCw,
  Users,
  FileText,
  CalendarDays
} from "lucide-react";
import AddIncomeForm from "./AddIncomeForm";
import AddExpenseForm from "./AddExpenseForm";
import DailyReport from "./DailyReport";
import Analytics from "./Analytics";
import TransactionHistory from "./TransactionHistory";
import CustomerBookings from "./CustomerBookings";
import StaffManagement from "./StaffManagement";
import InventoryManagement from "./InventoryManagement";
import RoomCalendar from "./RoomCalendar";
import ProfitLossReport from "./ProfitLossReport";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<'transactions'>;

interface TransactionInput {
  type: 'income' | 'expense';
  source?: string;
  category?: string;
  amount: number;
  date: string;
  note?: string;
}

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const { user, logout, hasPermission } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transactions');
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const addTransaction = async (transaction: TransactionInput) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        toast.error('Failed to add transaction');
        return;
      }

      // Add the new transaction to the state
      setTransactions(prev => [data, ...prev]);
      toast.success(`${transaction.type === 'income' ? 'Income' : 'Expense'} added successfully!`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  // Calculate today's totals
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === today);
  
  const todayIncome = todayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const todayExpenses = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const todayProfit = todayIncome - todayExpenses;

  // Income by source
  const incomeBySource = todayTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      if (t.source) {
        acc[t.source] = (acc[t.source] || 0) + Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Rooms': return <Home className="w-4 h-4" />;
      case 'Restaurant': return <Utensils className="w-4 h-4" />;
      case 'Pool': return <Waves className="w-4 h-4" />;
      case 'Café': return <Coffee className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Ashoka Resort</h1>
                <p className="text-sm text-gray-500">Business Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{user.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.role_name}</p>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchTransactions}
                className="text-gray-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleLogout} className="text-gray-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 bg-white shadow-sm">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            {hasPermission('bookings') && <TabsTrigger value="income">Add Income</TabsTrigger>}
            {hasPermission('bookings') && <TabsTrigger value="expense">Add Expense</TabsTrigger>}
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            {hasPermission('bookings') && <TabsTrigger value="bookings">Bookings</TabsTrigger>}
            {hasPermission('staff') && <TabsTrigger value="staff">Staff</TabsTrigger>}
            {hasPermission('inventory') && <TabsTrigger value="inventory">Inventory</TabsTrigger>}
            {hasPermission('reports') && <TabsTrigger value="reports">Reports</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Today's Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    Today's Income
                    <TrendingUp className="w-5 h-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(todayIncome)}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    Today's Expenses
                    <TrendingDown className="w-5 h-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(todayExpenses)}</div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-r ${todayProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white border-0 shadow-lg`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    Net Profit
                    <DollarSign className="w-5 h-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(todayProfit)}</div>
                  <Badge 
                    variant={todayProfit >= 0 ? "secondary" : "destructive"} 
                    className="mt-2"
                  >
                    {todayProfit >= 0 ? "Profit" : "Loss"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Income by Source */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Today's Income by Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Rooms', 'Restaurant', 'Pool', 'Café'].map((source) => (
                    <div key={source} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="flex justify-center mb-2 text-emerald-600">
                        {getSourceIcon(source)}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{source}</div>
                      <div className="text-lg font-semibold text-gray-800">
                        {formatCurrency(incomeBySource[source] || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab("calendar")}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Room Calendar</h3>
                      <p className="text-gray-600">Manage room availability</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hasPermission('bookings') && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab("income")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Plus className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Add Income</h3>
                        <p className="text-gray-600">Record revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasPermission('bookings') && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab("expense")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Plus className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Add Expense</h3>
                        <p className="text-gray-600">Track costs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasPermission('reports') && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab("reports")}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">P&L Report</h3>
                        <p className="text-gray-600">Financial insights</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <RoomCalendar />
          </TabsContent>

          {hasPermission('bookings') && (
            <TabsContent value="income">
              <AddIncomeForm onAddTransaction={addTransaction} />
            </TabsContent>
          )}

          {hasPermission('bookings') && (
            <TabsContent value="expense">
              <AddExpenseForm onAddTransaction={addTransaction} />
            </TabsContent>
          )}

          <TabsContent value="transactions">
            <TransactionHistory 
              transactions={transactions} 
              onTransactionUpdate={fetchTransactions}
            />
          </TabsContent>

          {hasPermission('bookings') && (
            <TabsContent value="bookings">
              <CustomerBookings />
            </TabsContent>
          )}

          {hasPermission('staff') && (
            <TabsContent value="staff">
              <StaffManagement />
            </TabsContent>
          )}

          {hasPermission('inventory') && (
            <TabsContent value="inventory">
              <InventoryManagement />
            </TabsContent>
          )}

          {hasPermission('reports') && (
            <TabsContent value="reports">
              <div className="space-y-6">
                <ProfitLossReport />
                <DailyReport transactions={transactions} />
                <Analytics transactions={transactions} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;