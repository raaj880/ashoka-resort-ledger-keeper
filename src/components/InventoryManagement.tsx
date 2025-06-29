
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
  Package, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  Edit,
  Trash2,
  TrendingDown,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  unit_price: number;
  supplier?: string;
  notes?: string;
  last_updated: string;
  created_at: string;
}

const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    min_quantity: "",
    unit_price: "",
    supplier: "",
    notes: ""
  });

  const categories = [
    "Food & Beverages",
    "Cleaning Supplies", 
    "Linens & Towels",
    "Kitchen Equipment",
    "Room Amenities",
    "Maintenance Supplies",
    "Office Supplies",
    "Pool Chemicals",
    "Other"
  ];

  const units = [
    "pieces", "kg", "liters", "packets", "boxes", "bottles", "rolls", "sets"
  ];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching inventory:', error);
        toast.error('Failed to load inventory data');
        return;
      }

      setInventory(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.quantity || !formData.unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        min_quantity: parseInt(formData.min_quantity) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        supplier: formData.supplier || null,
        notes: formData.notes || null,
        last_updated: new Date().toISOString()
      };

      if (editingItem) {
        const { error } = await supabase
          .from('inventory')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) {
          toast.error("Failed to update inventory item");
          return;
        }

        toast.success("Inventory item updated successfully");
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([itemData]);

        if (error) {
          toast.error("Failed to add inventory item");
          return;
        }

        toast.success("Inventory item added successfully");
      }

      resetForm();
      fetchInventory();
    } catch (error) {
      toast.error("An error occurred while saving inventory data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Failed to delete inventory item");
        return;
      }

      toast.success("Inventory item deleted successfully");
      fetchInventory();
    } catch (error) {
      toast.error("An error occurred while deleting inventory item");
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        toast.error("Failed to update quantity");
        return;
      }

      fetchInventory();
    } catch (error) {
      toast.error("An error occurred while updating quantity");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      quantity: "",
      unit: "",
      min_quantity: "",
      unit_price: "",
      supplier: "",
      notes: ""
    });
    setIsAddDialogOpen(false);
    setEditingItem(null);
  };

  const startEdit = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      min_quantity: item.min_quantity.toString(),
      unit_price: item.unit_price.toString(),
      supplier: item.supplier || "",
      notes: item.notes || ""
    });
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === "low") {
      matchesStatus = item.quantity <= item.min_quantity;
    } else if (statusFilter === "normal") {
      matchesStatus = item.quantity > item.min_quantity;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const uniqueCategories = [...new Set(inventory.map(item => item.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">Loading inventory data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold text-blue-700">{inventory.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-red-700">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold text-emerald-700">{uniqueCategories.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold text-purple-700">₹{totalValue.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Inventory Filters
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Item Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quantity">Current Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="unit">Unit *</Label>
                      <Select 
                        value={formData.unit} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="min_quantity">Minimum Quantity</Label>
                      <Input
                        id="min_quantity"
                        type="number"
                        min="0"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit_price">Unit Price (₹)</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this item..."
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingItem ? "Update Item" : "Add Item"}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="normal">Normal Stock</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No inventory items found matching your criteria
              </div>
            ) : (
              filteredInventory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.quantity <= item.min_quantity ? 'bg-red-100' : 'bg-emerald-100'
                    }`}>
                      {item.quantity <= item.min_quantity ? 
                        <AlertTriangle className="w-6 h-6 text-red-600" /> : 
                        <Package className="w-6 h-6 text-emerald-600" />
                      }
                    </div>
                    <div>
                      <div className="font-medium text-lg">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.category}</div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        {item.supplier && (
                          <span>Supplier: {item.supplier}</span>
                        )}
                        <span>Updated: {new Date(item.last_updated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 0}
                        >
                          -
                        </Button>
                        <span className="font-semibold w-16 text-center">
                          {item.quantity} {item.unit}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      {item.quantity <= item.min_quantity && (
                        <Badge variant="destructive" className="mt-1">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold">₹{item.unit_price}/unit</div>
                      <div className="text-sm text-gray-600">
                        Total: ₹{(item.quantity * item.unit_price).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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

export default InventoryManagement;
