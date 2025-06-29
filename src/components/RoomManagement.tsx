import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Home,
  Plus,
  Edit,
  Trash2,
  Users,
  IndianRupee,
  Bed,
  Search,
  Filter,
  Eye,
  Settings,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ROOM_TYPES, AMENITIES, DEFAULT_ROOM_PRICES, DEFAULT_ROOM_CAPACITY } from "@/lib/constants";
import { validatePrice, validateCapacity, normalizeRoomType } from "@/lib/utils";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  base_price: number;
  amenities: string[];
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const RoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null);

  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "",
    capacity: "2",
    base_price: "",
    amenities: [] as string[],
    description: ""
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  // Auto-populate capacity and price when room type changes
  useEffect(() => {
    if (formData.room_type && !editingRoom) {
      const roomType = formData.room_type as keyof typeof DEFAULT_ROOM_CAPACITY;
      const defaultCapacity = DEFAULT_ROOM_CAPACITY[roomType];
      const defaultPrice = DEFAULT_ROOM_PRICES[roomType];
      
      if (defaultCapacity) {
        setFormData(prev => ({ 
          ...prev, 
          capacity: defaultCapacity.toString(),
          base_price: defaultPrice.toString()
        }));
      }
    }
  }, [formData.room_type, editingRoom]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number');

      if (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load rooms');
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.room_number || !formData.room_type || !formData.base_price) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validatePrice(formData.base_price)) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!validateCapacity(formData.capacity)) {
      toast.error("Please enter a valid capacity (1-20 guests)");
      return;
    }

    try {
      const roomData = {
        room_number: formData.room_number.trim(),
        room_type: normalizeRoomType(formData.room_type),
        capacity: parseInt(formData.capacity),
        base_price: parseFloat(formData.base_price),
        amenities: formData.amenities,
        description: formData.description.trim() || null
      };

      if (editingRoom) {
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', editingRoom.id);

        if (error) {
          toast.error("Failed to update room");
          return;
        }

        toast.success("Room updated successfully");
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert([roomData]);

        if (error) {
          toast.error("Failed to add room");
          return;
        }

        toast.success("Room added successfully");
      }

      resetForm();
      fetchRooms();
    } catch (error) {
      toast.error("An error occurred while saving room data");
    }
  };

  const handleDelete = async (id: string, roomNumber: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        toast.error("Failed to delete room");
        return;
      }

      toast.success(`Room ${roomNumber} deleted successfully`);
      fetchRooms();
    } catch (error) {
      toast.error("An error occurred while deleting the room");
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: "",
      room_type: "",
      capacity: "2",
      base_price: "",
      amenities: [],
      description: ""
    });
    setIsAddDialogOpen(false);
    setEditingRoom(null);
  };

  const startEdit = (room: Room) => {
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      capacity: room.capacity.toString(),
      base_price: room.base_price.toString(),
      amenities: room.amenities,
      description: room.description || ""
    });
    setEditingRoom(room);
    setIsAddDialogOpen(true);
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'ac': return <Wind className="w-3 h-3" />;
      case 'tv': return <Tv className="w-3 h-3" />;
      case 'wifi': return <Wifi className="w-3 h-3" />;
      case 'parking': return <Car className="w-3 h-3" />;
      case 'room service': return <Coffee className="w-3 h-3" />;
      case 'balcony': return <MapPin className="w-3 h-3" />;
      default: return <Home className="w-3 h-3" />;
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.room_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || room.room_type === typeFilter;
    const isActive = room.is_active;
    
    return matchesSearch && matchesType && isActive;
  });

  const uniqueRoomTypes = [...new Set(rooms.map(room => room.room_type))];
  const totalRooms = rooms.filter(r => r.is_active).length;
  const averagePrice = totalRooms > 0 
    ? rooms.filter(r => r.is_active).reduce((sum, r) => sum + r.base_price, 0) / totalRooms 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Rooms</p>
                <p className="text-2xl font-bold text-blue-700">{totalRooms}</p>
              </div>
              <Home className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Room Types</p>
                <p className="text-2xl font-bold text-emerald-700">{uniqueRoomTypes.length}</p>
              </div>
              <Bed className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Average Price</p>
                <p className="text-2xl font-bold text-purple-700">₹{averagePrice.toFixed(0)}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Capacity</p>
                <p className="text-2xl font-bold text-orange-700">
                  {rooms.filter(r => r.is_active).reduce((sum, r) => sum + r.capacity, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Room Management
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRoom ? "Edit Room" : "Add New Room"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="room_number">Room Number *</Label>
                      <Input
                        id="room_number"
                        value={formData.room_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="room_type">Room Type *</Label>
                      <Select 
                        value={formData.room_type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="capacity">Capacity *</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        max="20"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="base_price">Base Price (₹) *</Label>
                      <Input
                        id="base_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.base_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Amenities</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {AMENITIES.map(amenity => (
                        <label key={amenity} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  amenities: [...prev.amenities, amenity] 
                                }));
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  amenities: prev.amenities.filter(a => a !== amenity) 
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm flex items-center space-x-1">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Room description..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingRoom ? "Update Room" : "Add Room"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Room Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Types</SelectItem>
                {uniqueRoomTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>

          <div className="mb-4">
            <Badge variant="outline" className="text-sm">
              Showing {filteredRooms.length} of {totalRooms} rooms
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Home className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-600">No rooms found</p>
            <p className="text-gray-500">Try adjusting your search or add a new room</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <Card key={room.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{room.room_number}</CardTitle>
                    <p className="text-gray-600">{room.room_type}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingRoom(room)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(room)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Room</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete room {room.room_number}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(room.id, room.room_number)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{room.capacity} guests</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <IndianRupee className="w-4 h-4 mr-1" />
                      <span className="font-semibold">₹{room.base_price}</span>
                    </div>
                  </div>

                  {room.amenities.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Amenities:</p>
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 4).map(amenity => (
                          <Badge key={amenity} variant="secondary" className="text-xs flex items-center space-x-1">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </Badge>
                        ))}
                        {room.amenities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{room.amenities.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {room.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Room Details Dialog */}
      <Dialog open={!!viewingRoom} onOpenChange={() => setViewingRoom(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Room Details - {viewingRoom?.room_number}</DialogTitle>
          </DialogHeader>
          {viewingRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room Type</Label>
                  <p className="text-lg font-medium">{viewingRoom.room_type}</p>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <p className="text-lg font-medium">{viewingRoom.capacity} guests</p>
                </div>
              </div>
              
              <div>
                <Label>Base Price</Label>
                <p className="text-lg font-medium">₹{viewingRoom.base_price} per night</p>
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {viewingRoom.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary" className="flex items-center space-x-1">
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {viewingRoom.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-gray-700 mt-1">{viewingRoom.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label>Created</Label>
                  <p>{new Date(viewingRoom.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p>{new Date(viewingRoom.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManagement;