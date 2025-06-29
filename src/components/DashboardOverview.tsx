import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Home,
  Utensils,
  Coffee,
  Waves,
  Users,
  FileText,
  CalendarDays,
  Settings,
  ArrowRight,
  Activity,
  Clock,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatDateForDisplay } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<'transactions'>;

interface DashboardOverviewProps {
  onNavigateToTab: (tab: string) => void;
  transactions: Transaction[];
  roomStats: {
    totalRooms: number;
    occupiedToday: number;
    availableToday: number;
    checkInsToday: number;
    checkOutsToday: number;
  };
}

interface DashboardStats {
  todayIncome: number;
  todayExpenses: number;
  todayProfit: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  incomeBySource: Record<string, number>;
  expensesByCategory: Record<string, number>;
  recentTransactions: Transaction[];
  profitTrend: number;
  occupancyRate: number;
}

const DashboardOverview = ({ onNavigateToTab, transactions, roomStats }: DashboardOverviewProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    todayIncome: 0,
    todayExpenses: 0,
    todayProfit: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0,
    incomeBySource: {},
    expensesByCategory: {},
    recentTransactions: [],
    profitTrend: 0,
    occupancyRate: 0
  });

  useEffect(() => {
    calculateStats();
  }, [transactions, roomStats]);

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Today's calculations
    const todayTransactions = transactions.filter(t => t.date === today);
    const todayIncome = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const todayExpenses = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const todayProfit = todayIncome - todayExpenses;

    // Monthly calculations
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyProfit = monthlyIncome - monthlyExpenses;

    // Income by source (today)
    const incomeBySource = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        if (t.source) {
          acc[t.source] = (acc[t.source] || 0) + Number(t.amount);
        }
        return acc;
      }, {} as Record<string, number>);

    // Expenses by category (today)
    const expensesByCategory = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        if (t.category) {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        }
        return acc;
      }, {} as Record<string, number>);

    // Recent transactions (last 5)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Profit trend (compare with yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayTransactions = transactions.filter(t => t.date === yesterdayStr);
    const yesterdayProfit = yesterdayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) -
      yesterdayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const profitTrend = yesterdayProfit > 0 ? ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100 : 0;

    // Occupancy rate
    const occupancyRate = roomStats.totalRooms > 0 
      ? (roomStats.occupiedToday / roomStats.totalRooms) * 100 
      : 0;

    setStats({
      todayIncome,
      todayExpenses,
      todayProfit,
      monthlyIncome,
      monthlyExpenses,
      monthlyProfit,
      incomeBySource,
      expensesByCategory,
      recentTransactions,
      profitTrend,
      occupancyRate
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Rooms': return <Home className="w-4 h-4" />;
      case 'Restaurant': return <Utensils className="w-4 h-4" />;
      case 'Pool': return <Waves className="w-4 h-4" />;
      case 'Café': return <Coffee className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-3 h-3" />;
    if (value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Activity className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Main Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => onNavigateToTab("income")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Today's Income
              <TrendingUp className="w-5 h-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.todayIncome)}</div>
            <div className="flex items-center mt-2 text-emerald-100">
              <span className="text-sm">Monthly: {formatCurrency(stats.monthlyIncome)}</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => onNavigateToTab("expense")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Today's Expenses
              <TrendingDown className="w-5 h-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.todayExpenses)}</div>
            <div className="flex items-center mt-2 text-red-100">
              <span className="text-sm">Monthly: {formatCurrency(stats.monthlyExpenses)}</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${stats.todayProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow`} onClick={() => onNavigateToTab("reports")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Net Profit
              <DollarSign className="w-5 h-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.todayProfit)}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-1">
                {getTrendIcon(stats.profitTrend)}
                <span className="text-sm">
                  {stats.profitTrend > 0 ? '+' : ''}{stats.profitTrend.toFixed(1)}%
                </span>
              </div>
              <Badge 
                variant={stats.todayProfit >= 0 ? "secondary" : "destructive"} 
                className="bg-white/20"
              >
                {stats.todayProfit >= 0 ? "Profit" : "Loss"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Management Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigateToTab("rooms")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Rooms</p>
                <p className="text-2xl font-bold text-blue-700">{roomStats.totalRooms}</p>
              </div>
              <Home className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-blue-500">Manage Rooms</span>
              <ArrowRight className="w-3 h-3 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigateToTab("calendar")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Available Today</p>
                <p className="text-2xl font-bold text-emerald-700">{roomStats.availableToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-emerald-500">View Calendar</span>
              <ArrowRight className="w-3 h-3 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigateToTab("bookings")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Occupied Today</p>
                <p className="text-2xl font-bold text-red-700">{roomStats.occupiedToday}</p>
              </div>
              <Users className="w-8 h-8 text-red-600" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-red-500">Manage Bookings</span>
              <ArrowRight className="w-3 h-3 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Occupancy Rate</p>
                <p className="text-2xl font-bold text-purple-700">{stats.occupancyRate.toFixed(0)}%</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Today's Activity - {formatDateForDisplay(new Date())}
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigateToTab("transactions")}>
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-emerald-700">Check-ins & Check-outs</h4>
              <div className="space-y-2">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600">Expected Arrivals</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      {roomStats.checkInsToday}
                    </Badge>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600">Expected Departures</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {roomStats.checkOutsToday}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Recent Transactions</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-600">
                          {transaction.source || transaction.category}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No transactions today</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income by Source */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Today's Income by Source
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigateToTab("income")}>
              Add Income
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Rooms', 'Restaurant', 'Pool', 'Café'].map((source) => (
              <div key={source} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors">
                <div className="flex justify-center mb-2 text-emerald-600">
                  {getSourceIcon(source)}
                </div>
                <div className="text-sm text-gray-600 mb-1">{source}</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formatCurrency(stats.incomeBySource[source] || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.incomeBySource[source] > 0 ? 'Active' : 'No income'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onNavigateToTab("calendar")}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Room Calendar</h3>
                <p className="text-gray-600">Manage availability</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onNavigateToTab("staff")}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Staff Management</h3>
                <p className="text-gray-600">Manage team</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onNavigateToTab("inventory")}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Inventory</h3>
                <p className="text-gray-600">Track supplies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onNavigateToTab("reports")}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">P&L Report</h3>
                <p className="text-gray-600">Financial insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      {(roomStats.checkInsToday > 0 || roomStats.checkOutsToday > 0 || stats.todayProfit < 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Important Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roomStats.checkInsToday > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm">
                    {roomStats.checkInsToday} guest{roomStats.checkInsToday !== 1 ? 's' : ''} checking in today
                  </span>
                </div>
              )}
              {roomStats.checkOutsToday > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">
                    {roomStats.checkOutsToday} guest{roomStats.checkOutsToday !== 1 ? 's' : ''} checking out today
                  </span>
                </div>
              )}
              {stats.todayProfit < 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">
                    Today's expenses exceed income by {formatCurrency(Math.abs(stats.todayProfit))}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;