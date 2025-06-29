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
  CalendarDays,
  Settings,
  BarChart3
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
import RoomManagement from "./RoomManagement";
import ProfitLossReport from "./ProfitLossReport";
import DashboardOverview from "./DashboardOverview";
import FinancialSummary from "./FinancialSummary";
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
  const [roomStats, setRoomStats] = useState({
    totalRooms: 0,
    occupiedToday: 0,
    availableToday: 0,
    checkInsToday: 0,
    checkOutsToday: 0
  });

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

  const fetchRoomStats = async () => {
    try {
      // Fetch total rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // Fetch today's bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or(`check_in.eq.${today},check_out.eq.${today}`)
        .in('status', ['confirmed', 'checked_in']);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      const checkInsToday = bookings?.filter(b => b.check_in === today).length || 0;
      const checkOutsToday = bookings?.filter(b => b.check_out === today).length || 0;

      // Fetch room availability for today
      const { data: availability, error: availabilityError } = await supabase
        .from('room_availability')
        .select('*')
        .eq('date', today);

      if (availabilityError) {
        console.error('Error fetching availability:', availabilityError);
        return;
      }

      const totalRooms = rooms?.length || 0;
      const occupiedToday = availability?.filter(a => a.status === 'occupied').length || 0;
      const availableToday = totalRooms - occupiedToday;

      setRoomStats({
        totalRooms,
        occupiedToday,
        availableToday,
        checkInsToday,
        checkOutsToday
      });
    } catch (error) {
      console.error('Error fetching room stats:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchRoomStats();
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

  const handleTabNavigation = (tab: string) => {
    setActiveTab(tab);
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
                onClick={() => {
                  fetchTransactions();
                  fetchRoomStats();
                }}
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
          <TabsList className="grid w-full grid-cols-11 bg-white shadow-sm">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            {hasPermission('bookings') && <TabsTrigger value="income">Add Income</TabsTrigger>}
            {hasPermission('bookings') && <TabsTrigger value="expense">Add Expense</TabsTrigger>}
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            {hasPermission('bookings') && <TabsTrigger value="bookings">Bookings</TabsTrigger>}
            {hasPermission('staff') && <TabsTrigger value="staff">Staff</TabsTrigger>}
            {hasPermission('inventory') && <TabsTrigger value="inventory">Inventory</TabsTrigger>}
            {hasPermission('reports') && <TabsTrigger value="reports">Reports</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview 
              onNavigateToTab={handleTabNavigation}
              transactions={transactions}
              roomStats={roomStats}
            />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <FinancialSummary 
              transactions={transactions}
              onNavigateToTab={handleTabNavigation}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <RoomCalendar />
          </TabsContent>

          <TabsContent value="rooms">
            <RoomManagement />
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