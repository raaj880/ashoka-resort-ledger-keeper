import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Plus, Home, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  base_price: number;
  amenities: string[];
  is_active: boolean;
}

interface RoomAvailability {
  id: string;
  room_id: string;
  date: string;
  status: 'available' | 'occupied' | 'maintenance' | 'blocked';
  booking_id?: string;
  notes?: string;
}

interface Booking {
  id: string;
  customer_id: string;
  check_in: string;
  check_out: string;
  room_type: string;
  guests: number;
  total_amount: number;
  status: string;
  customer?: {
    name: string;
    phone: string;
  };
}

const RoomCalendar = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const [roomForm, setRoomForm] = useState({
    room_number: "",
    room_type: "",
    capacity: "2",
    base_price: "",
    amenities: [] as string[],
    description: ""
  });

  const roomTypes = ["Standard Room", "Deluxe Room", "Suite", "Family Room", "Pool View Room"];
  const amenityOptions = ["AC", "TV", "WiFi", "Mini Fridge", "Balcony", "Pool View", "Extra Beds"];

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchAvailability(), fetchBookings()]);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('room_number');

    if (error) {
      console.error('Error fetching rooms:', error);
      return;
    }

    setRooms(data || []);
  };

  const fetchAvailability = async () => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

    const { data, error } = await supabase
      .from('room_availability')
      .select('*')
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'));

    if (error) {
      console.error('Error fetching availability:', error);
      return;
    }

    setAvailability(data || []);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(name, phone)
      `)
      .in('status', ['confirmed', 'checked_in']);

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    setBookings(data || []);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomForm.room_number || !roomForm.room_type || !roomForm.base_price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .insert([{
          room_number: roomForm.room_number,
          room_type: roomForm.room_type,
          capacity: parseInt(roomForm.capacity),
          base_price: parseFloat(roomForm.base_price),
          amenities: roomForm.amenities,
          description: roomForm.description || null
        }]);

      if (error) {
        toast.error("Failed to add room");
        return;
      }

      toast.success("Room added successfully");
      setIsAddRoomOpen(false);
      setRoomForm({
        room_number: "",
        room_type: "",
        capacity: "2",
        base_price: "",
        amenities: [],
        description: ""
      });
      fetchRooms();
    } catch (error) {
      toast.error("An error occurred while adding the room");
    }
  };

  const updateRoomStatus = async (roomId: string, date: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('room_availability')
        .upsert({
          room_id: roomId,
          date,
          status,
          notes: notes || null
        });

      if (error) {
        toast.error("Failed to update room status");
        return;
      }

      toast.success("Room status updated");
      fetchAvailability();
      setIsStatusDialogOpen(false);
    } catch (error) {
      toast.error("An error occurred while updating room status");
    }
  };

  const getRoomStatus = (roomId: string, date: string) => {
    const availability = getAvailabilityForDate(roomId, date);
    if (availability) {
      return availability.status;
    }

    // Check if room is booked
    const booking = bookings.find(b => 
      b.room_type === rooms.find(r => r.id === roomId)?.room_type &&
      date >= b.check_in && date < b.check_out &&
      b.status !== 'cancelled'
    );

    return booking ? 'occupied' : 'available';
  };

  const getAvailabilityForDate = (roomId: string, date: string) => {
    return availability.find(a => a.room_id === roomId && a.date === date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'blocked': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '✓';
      case 'occupied': return '👤';
      case 'maintenance': return '🔧';
      case 'blocked': return '🚫';
      default: return '✓';
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">Loading room calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Room Availability Calendar
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[200px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button variant="outline" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddRoom} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="room_number">Room Number *</Label>
                        <Input
                          id="room_number"
                          value={roomForm.room_number}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, room_number: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="room_type">Room Type *</Label>
                        <Select 
                          value={roomForm.room_type} 
                          onValueChange={(value) => setRoomForm(prev => ({ ...prev, room_type: value }))}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          value={roomForm.capacity}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, capacity: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="base_price">Base Price (₹) *</Label>
                        <Input
                          id="base_price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={roomForm.base_price}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, base_price: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button type="submit" className="flex-1">Add Room</Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddRoomOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-emerald-100 border border-emerald-200 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-sm">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
              <span className="text-sm">Maintenance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-sm">Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <Home className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">No rooms available</p>
              <p className="text-gray-500">Add rooms to start managing availability</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-[200px_repeat(31,1fr)] gap-1 mb-2">
                  <div className="font-semibold text-gray-700 p-2">Room</div>
                  {monthDays.map((day) => (
                    <div key={day.toISOString()} className="text-center p-1">
                      <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
                      <div className="text-sm font-medium">{format(day, 'd')}</div>
                    </div>
                  ))}
                </div>

                {/* Room Rows */}
                {rooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-[200px_repeat(31,1fr)] gap-1 mb-1">
                    <div className="p-2 bg-gray-50 rounded flex flex-col">
                      <span className="font-medium">{room.room_number}</span>
                      <span className="text-xs text-gray-500">{room.room_type}</span>
                      <span className="text-xs text-gray-500">₹{room.base_price}</span>
                    </div>
                    {monthDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const status = getRoomStatus(room.id, dateStr);
                      return (
                        <button
                          key={day.toISOString()}
                          className={`p-1 rounded text-xs border transition-colors hover:opacity-80 ${getStatusColor(status)}`}
                          onClick={() => {
                            setSelectedRoom(room);
                            setSelectedDate(dateStr);
                            setIsStatusDialogOpen(true);
                          }}
                          title={`${room.room_number} - ${dateStr} - ${status}`}
                        >
                          {getStatusIcon(status)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Room Status - {selectedRoom?.room_number} ({selectedDate})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {['available', 'occupied', 'maintenance', 'blocked'].map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  className={`${getStatusColor(status)} justify-start`}
                  onClick={() => selectedRoom && updateRoomStatus(selectedRoom.id, selectedDate, status)}
                >
                  <span className="mr-2">{getStatusIcon(status)}</span>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomCalendar;