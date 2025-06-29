import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Home, 
  AlertCircle,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  IndianRupee,
  CalendarDays,
  Clock,
  MapPin,
  Bed,
  Wifi,
  Car,
  Coffee as CoffeeIcon,
  Tv,
  Wind
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isToday, isBefore, isAfter } from "date-fns";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  base_price: number;
  amenities: string[];
  description?: string;
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
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isRoomDetailsOpen, setIsRoomDetailsOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  
  // Selected items
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [roomForm, setRoomForm] = useState({
    room_number: "",
    room_type: "",
    capacity: "2",
    base_price: "",
    amenities: [] as string[],
    description: ""
  });

  const [statusForm, setStatusForm] = useState({
    status: 'available' as 'available' | 'occupied' | 'maintenance' | 'blocked',
    notes: ''
  });

  const roomTypes = ["Standard Room", "Deluxe Room", "Suite", "Family Room", "Pool View Room"];
  const amenityOptions = ["AC", "TV", "WiFi", "Mini Fridge", "Balcony", "Pool View", "Extra Beds", "Parking", "Room Service"];

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
    const startDate = viewMode === 'month' 
      ? startOfMonth(currentDate) 
      : addDays(currentDate, -currentDate.getDay());
    const endDate = viewMode === 'month' 
      ? endOfMonth(currentDate)
      : addDays(startDate, 6);

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
      resetRoomForm();
      fetchRooms();
    } catch (error) {
      toast.error("An error occurred while adding the room");
    }
  };

  const updateRoomStatus = async () => {
    if (!selectedRoom || !selectedDate) return;

    try {
      const { error } = await supabase
        .from('room_availability')
        .upsert({
          room_id: selectedRoom.id,
          date: selectedDate,
          status: statusForm.status,
          notes: statusForm.notes || null
        });

      if (error) {
        toast.error("Failed to update room status");
        return;
      }

      toast.success("Room status updated");
      fetchAvailability();
      setIsStatusDialogOpen(false);
      resetStatusForm();
    } catch (error) {
      toast.error("An error occurred while updating room status");
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', roomId);

      if (error) {
        toast.error("Failed to delete room");
        return;
      }

      toast.success("Room deleted successfully");
      fetchRooms();
    } catch (error) {
      toast.error("An error occurred while deleting the room");
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

  const getBookingForDate = (roomId: string, date: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return null;

    return bookings.find(b => 
      b.room_type === room.room_type &&
      date >= b.check_in && date < b.check_out &&
      b.status !== 'cancelled'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
      case 'blocked': return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'ac': return <Wind className="w-3 h-3" />;
      case 'tv': return <Tv className="w-3 h-3" />;
      case 'wifi': return <Wifi className="w-3 h-3" />;
      case 'parking': return <Car className="w-3 h-3" />;
      case 'room service': return <CoffeeIcon className="w-3 h-3" />;
      default: return <Home className="w-3 h-3" />;
    }
  };

  const resetRoomForm = () => {
    setRoomForm({
      room_number: "",
      room_type: "",
      capacity: "2",
      base_price: "",
      amenities: [],
      description: ""
    });
    setIsAddRoomOpen(false);
  };

  const resetStatusForm = () => {
    setStatusForm({
      status: 'available',
      notes: ''
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 7) : addDays(currentDate, -7));
    }
  };

  const getDaysToShow = () => {
    if (viewMode === 'month') {
      return eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
    } else {
      const startOfWeek = addDays(currentDate, -currentDate.getDay());
      return eachDayOfInterval({
        start: startOfWeek,
        end: addDays(startOfWeek, 6)
      });
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesType = selectedRoomType === 'all' || room.room_type === selectedRoomType;
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.room_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const uniqueRoomTypes = [...new Set(rooms.map(room => room.room_type))];
  const daysToShow = getDaysToShow();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">Loading room calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Room Availability Calendar
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[200px] text-center">
                  {viewMode === 'month' 
                    ? format(currentDate, 'MMMM yyyy')
                    : `${format(daysToShow[0], 'MMM d')} - ${format(daysToShow[6], 'MMM d, yyyy')}`
                  }
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button onClick={() => setCurrentDate(new Date())} variant="outline" size="sm">
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>

              <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Room Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Room Types</SelectItem>
                  {uniqueRoomTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant="outline" className="text-sm">
                {filteredRooms.length} rooms
              </Badge>
            </div>

            {/* Add Room Button */}
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

                  <div>
                    <Label>Amenities</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {amenityOptions.map(amenity => (
                        <label key={amenity} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roomForm.amenities.includes(amenity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRoomForm(prev => ({ 
                                  ...prev, 
                                  amenities: [...prev.amenities, amenity] 
                                }));
                              } else {
                                setRoomForm(prev => ({ 
                                  ...prev, 
                                  amenities: prev.amenities.filter(a => a !== amenity) 
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={roomForm.description}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Room description..."
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">Add Room</Button>
                    <Button type="button" variant="outline" onClick={resetRoomForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
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
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8">
              <Home className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">No rooms found</p>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className={`grid gap-1 mb-2`} style={{
                  gridTemplateColumns: `250px repeat(${daysToShow.length}, 1fr)`
                }}>
                  <div className="font-semibold text-gray-700 p-2">Room Details</div>
                  {daysToShow.map((day) => (
                    <div key={day.toISOString()} className={`text-center p-1 rounded ${
                      isToday(day) ? 'bg-blue-100 text-blue-800' : ''
                    }`}>
                      <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
                      <div className="text-sm font-medium">{format(day, 'd')}</div>
                      {viewMode === 'week' && (
                        <div className="text-xs text-gray-400">{format(day, 'MMM')}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Room Rows */}
                {filteredRooms.map((room) => (
                  <div key={room.id} className={`grid gap-1 mb-1`} style={{
                    gridTemplateColumns: `250px repeat(${daysToShow.length}, 1fr)`
                  }}>
                    <div className="p-3 bg-gray-50 rounded flex flex-col border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-lg">{room.room_number}</span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRoom(room);
                              setIsRoomDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRoom(room.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 mb-1">{room.room_type}</span>
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <Users className="w-3 h-3 mr-1" />
                        {room.capacity} guests
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <IndianRupee className="w-3 h-3 mr-1" />
                        ₹{room.base_price}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map(amenity => (
                          <div key={amenity} className="flex items-center text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                            {getAmenityIcon(amenity)}
                            <span className="ml-1">{amenity}</span>
                          </div>
                        ))}
                        {room.amenities.length > 3 && (
                          <div className="text-xs text-gray-500">+{room.amenities.length - 3}</div>
                        )}
                      </div>
                    </div>
                    
                    {daysToShow.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const status = getRoomStatus(room.id, dateStr);
                      const booking = getBookingForDate(room.id, dateStr);
                      const isPast = isBefore(day, new Date()) && !isToday(day);
                      
                      return (
                        <button
                          key={day.toISOString()}
                          className={`p-2 rounded text-xs border transition-all duration-200 ${getStatusColor(status)} ${
                            isPast ? 'opacity-50' : ''
                          } relative group`}
                          onClick={() => {
                            setSelectedRoom(room);
                            setSelectedDate(dateStr);
                            if (booking) {
                              setSelectedBooking(booking);
                              setIsBookingDialogOpen(true);
                            } else {
                              setIsStatusDialogOpen(true);
                            }
                          }}
                          title={`${room.room_number} - ${dateStr} - ${status}${booking ? ` - ${booking.customer?.name}` : ''}`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-lg">{getStatusIcon(status)}</span>
                            {booking && (
                              <div className="text-xs mt-1 truncate w-full">
                                {booking.customer?.name}
                              </div>
                            )}
                          </div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {booking && ` - ${booking.customer?.name}`}
                          </div>
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

      {/* Room Details Dialog */}
      <Dialog open={isRoomDetailsOpen} onOpenChange={setIsRoomDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Room Details - {selectedRoom?.room_number}</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room Type</Label>
                  <p className="text-lg font-medium">{selectedRoom.room_type}</p>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <p className="text-lg font-medium">{selectedRoom.capacity} guests</p>
                </div>
              </div>
              
              <div>
                <Label>Base Price</Label>
                <p className="text-lg font-medium">₹{selectedRoom.base_price} per night</p>
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRoom.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary" className="flex items-center space-x-1">
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedRoom.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-gray-700 mt-1">{selectedRoom.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Room Status - {selectedRoom?.room_number} ({selectedDate})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select 
                value={statusForm.status} 
                onValueChange={(value: any) => setStatusForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={statusForm.notes}
                onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this status change..."
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={updateRoomStatus} className="flex-1">
                Update Status
              </Button>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guest Name</Label>
                  <p className="font-medium">{selectedBooking.customer?.name}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="font-medium">{selectedBooking.customer?.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check-in</Label>
                  <p className="font-medium">{format(parseISO(selectedBooking.check_in), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <Label>Check-out</Label>
                  <p className="font-medium">{format(parseISO(selectedBooking.check_out), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guests</Label>
                  <p className="font-medium">{selectedBooking.guests}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium">₹{selectedBooking.total_amount}</p>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Badge variant={selectedBooking.status === 'confirmed' ? 'default' : 'secondary'}>
                  {selectedBooking.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomCalendar;