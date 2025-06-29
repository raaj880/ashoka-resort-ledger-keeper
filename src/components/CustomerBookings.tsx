
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  IndianRupee,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: string;
  customer_id: string;
  customer?: Customer;
  check_in: string;
  check_out: string;
  room_type: string;
  guests: number;
  total_amount: number;
  advance_paid: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

const CustomerBookings = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  const [bookingForm, setBookingForm] = useState({
    customer_id: "",
    check_in: "",
    check_out: "",
    room_type: "",
    guests: "1",
    total_amount: "",
    advance_paid: "",
    status: "confirmed" as "confirmed" | "checked_in" | "checked_out" | "cancelled",
    special_requests: ""
  });

  const roomTypes = [
    "Standard Room",
    "Deluxe Room", 
    "Suite",
    "Family Room",
    "Pool View Room"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch customers using proper type assertion
      const customersResult = await (supabase as any)
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch bookings with customer data using proper type assertion
      const bookingsResult = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (customersResult.error) {
        console.error('Error fetching customers:', customersResult.error);
        toast.error('Failed to load customers');
      } else {
        setCustomers(customersResult.data || []);
      }

      if (bookingsResult.error) {
        console.error('Error fetching bookings:', bookingsResult.error);
        toast.error('Failed to load bookings');
      } else {
        setBookings(bookingsResult.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerForm.name || !customerForm.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const customerData = {
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email || null,
        address: customerForm.address || null
      };

      if (editingCustomer) {
        const { error } = await (supabase as any)
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id);

        if (error) {
          toast.error("Failed to update customer");
          return;
        }

        toast.success("Customer updated successfully");
      } else {
        const { error } = await (supabase as any)
          .from('customers')
          .insert([customerData]);

        if (error) {
          toast.error("Failed to add customer");
          return;
        }

        toast.success("Customer added successfully");
      }

      resetCustomerForm();
      fetchData();
    } catch (error) {
      toast.error("An error occurred while saving customer data");
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingForm.customer_id || !bookingForm.check_in || !bookingForm.check_out || !bookingForm.room_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const bookingData = {
        customer_id: bookingForm.customer_id,
        check_in: bookingForm.check_in,
        check_out: bookingForm.check_out,
        room_type: bookingForm.room_type,
        guests: parseInt(bookingForm.guests),
        total_amount: parseFloat(bookingForm.total_amount) || 0,
        advance_paid: parseFloat(bookingForm.advance_paid) || 0,
        status: bookingForm.status,
        special_requests: bookingForm.special_requests || null
      };

      if (editingBooking) {
        const { error } = await (supabase as any)
          .from('bookings')
          .update(bookingData)
          .eq('id', editingBooking.id);

        if (error) {
          toast.error("Failed to update booking");
          return;
        }

        toast.success("Booking updated successfully");
      } else {
        const { error } = await (supabase as any)
          .from('bookings')
          .insert([bookingData]);

        if (error) {
          toast.error("Failed to add booking");
          return;
        }

        toast.success("Booking added successfully");
      }

      resetBookingForm();
      fetchData();
    } catch (error) {
      toast.error("An error occurred while saving booking data");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This will also delete all their bookings.")) return;

    try {
      const { error } = await (supabase as any)
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Failed to delete customer");
        return;
      }

      toast.success("Customer deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("An error occurred while deleting customer");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Failed to delete booking");
        return;
      }

      toast.success("Booking deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("An error occurred while deleting booking");
    }
  };

  const updateBookingStatus = async (id: string, newStatus: "confirmed" | "checked_in" | "checked_out" | "cancelled") => {
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        toast.error("Failed to update booking status");
        return;
      }

      toast.success(`Booking ${newStatus.replace('_', ' ')}`);
      fetchData();
    } catch (error) {
      toast.error("An error occurred while updating booking status");
    }
  };

  const resetCustomerForm = () => {
    setCustomerForm({ name: "", phone: "", email: "", address: "" });
    setIsAddCustomerOpen(false);
    setEditingCustomer(null);
  };

  const resetBookingForm = () => {
    setBookingForm({
      customer_id: "",
      check_in: "",
      check_out: "",
      room_type: "",
      guests: "1",
      total_amount: "",
      advance_paid: "",
      status: "confirmed",
      special_requests: ""
    });
    setIsAddBookingOpen(false);
    setEditingBooking(null);
  };

  const startEditCustomer = (customer: Customer) => {
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || ""
    });
    setEditingCustomer(customer);
    setIsAddCustomerOpen(true);
  };

  const startEditBooking = (booking: Booking) => {
    setBookingForm({
      customer_id: booking.customer_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      room_type: booking.room_type,
      guests: booking.guests.toString(),
      total_amount: booking.total_amount.toString(),
      advance_paid: booking.advance_paid.toString(),
      status: booking.status,
      special_requests: booking.special_requests || ""
    });
    setEditingBooking(booking);
    setIsAddBookingOpen(true);
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.room_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customer?.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-emerald-100 text-emerald-800';
      case 'checked_out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Clock className="w-4 h-4" />;
      case 'checked_in': return <CheckCircle className="w-4 h-4" />;
      case 'checked_out': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total_amount, 0);
  
  const totalAdvance = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.advance_paid, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">Loading booking data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Customers</p>
                <p className="text-2xl font-bold text-blue-700">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Total Bookings</p>
                <p className="text-2xl font-bold text-emerald-700">{bookings.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-700">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Advance Collected</p>
                <p className="text-2xl font-bold text-orange-700">₹{totalAdvance.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetCustomerForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Full Name *</Label>
                <Input
                  id="customer_name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Phone Number *</Label>
                <Input
                  id="customer_phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="customer_address">Address</Label>
                <Textarea
                  id="customer_address"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetCustomerForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetBookingForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBooking ? "Edit Booking" : "Add New Booking"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="booking_customer">Customer *</Label>
                  <Select 
                    value={bookingForm.customer_id} 
                    onValueChange={(value) => setBookingForm(prev => ({ ...prev, customer_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="booking_room_type">Room Type *</Label>
                  <Select 
                    value={bookingForm.room_type} 
                    onValueChange={(value) => setBookingForm(prev => ({ ...prev, room_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="booking_checkin">Check In *</Label>
                  <Input
                    id="booking_checkin"
                    type="date"
                    value={bookingForm.check_in}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, check_in: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="booking_checkout">Check Out *</Label>
                  <Input
                    id="booking_checkout"
                    type="date"
                    value={bookingForm.check_out}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, check_out: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="booking_guests">Guests</Label>
                  <Input
                    id="booking_guests"
                    type="number"
                    min="1"
                    value={bookingForm.guests}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, guests: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="booking_total">Total Amount (₹)</Label>
                  <Input
                    id="booking_total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingForm.total_amount}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, total_amount: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="booking_advance">Advance Paid (₹)</Label>
                  <Input
                    id="booking_advance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingForm.advance_paid}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, advance_paid: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="booking_status">Status</Label>
                  <Select 
                    value={bookingForm.status} 
                    onValueChange={(value: "confirmed" | "checked_in" | "checked_out" | "cancelled") => 
                      setBookingForm(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="checked_out">Checked Out</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="booking_requests">Special Requests</Label>
                <Textarea
                  id="booking_requests"
                  value={bookingForm.special_requests}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, special_requests: e.target.value }))}
                  placeholder="Any special requests from the customer..."
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingBooking ? "Update Booking" : "Add Booking"}
                </Button>
                <Button type="button" variant="outline" onClick={resetBookingForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Search & Filter Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers or bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>

          <div className="mt-4">
            <Badge variant="outline" className="text-sm">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bookings found matching your criteria
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                    </div>
                    <div>
                      <div className="font-medium text-lg">{booking.customer?.name}</div>
                      <div className="text-sm text-gray-600">{booking.room_type} • {booking.guests} guests</div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {booking.customer?.phone}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-lg">₹{booking.total_amount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">
                        Advance: ₹{booking.advance_paid.toLocaleString()}
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-1">
                      {booking.status === 'confirmed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'checked_in')}
                          className="text-emerald-600"
                        >
                          Check In
                        </Button>
                      )}
                      {booking.status === 'checked_in' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'checked_out')}
                          className="text-blue-600"
                        >
                          Check Out
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditBooking(booking)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerBookings;
