import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  IndianRupee,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STAFF_POSITIONS } from "@/lib/constants";
import { formatDateForInput, formatDateForDisplay, validatePrice } from "@/lib/utils";

interface Staff {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  position: string;
  salary: number;
  hire_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const StaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    position: "",
    salary: "",
    hire_date: formatDateForInput(new Date()),
    status: "active" as "active" | "inactive"
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching staff:', error);
        toast.error('Failed to load staff data');
        return;
      }

      setStaff(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.position || !formData.salary) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validatePrice(formData.salary)) {
      toast.error("Please enter a valid salary amount");
      return;
    }

    try {
      const staffData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        position: formData.position,
        salary: parseFloat(formData.salary),
        hire_date: formData.hire_date,
        status: formData.status
      };

      if (editingStaff) {
        const { error } = await supabase
          .from('staff')
          .update(staffData)
          .eq('id', editingStaff.id);

        if (error) {
          toast.error("Failed to update staff member");
          return;
        }

        toast.success("Staff member updated successfully");
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([staffData]);

        if (error) {
          toast.error("Failed to add staff member");
          return;
        }

        toast.success("Staff member added successfully");
      }

      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error("An error occurred while saving staff data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Failed to delete staff member");
        return;
      }

      toast.success("Staff member deleted successfully");
      fetchStaff();
    } catch (error) {
      toast.error("An error occurred while deleting staff member");
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('staff')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        toast.error("Failed to update staff status");
        return;
      }

      toast.success(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchStaff();
    } catch (error) {
      toast.error("An error occurred while updating staff status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      position: "",
      salary: "",
      hire_date: formatDateForInput(new Date()),
      status: "active"
    });
    setIsAddDialogOpen(false);
    setEditingStaff(null);
  };

  const startEdit = (staffMember: Staff) => {
    setFormData({
      name: staffMember.name,
      phone: staffMember.phone,
      email: staffMember.email || "",
      address: staffMember.address || "",
      position: staffMember.position,
      salary: staffMember.salary.toString(),
      hire_date: staffMember.hire_date,
      status: staffMember.status
    });
    setEditingStaff(staffMember);
    setIsAddDialogOpen(true);
  };

  const activeStaff = staff.filter(s => s.status === 'active');
  const totalSalaryExpense = activeStaff.reduce((sum, s) => sum + s.salary, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">Loading staff data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Staff</p>
                <p className="text-2xl font-bold text-blue-700">{staff.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Active Staff</p>
                <p className="text-2xl font-bold text-emerald-700">{activeStaff.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Monthly Salary</p>
                <p className="text-2xl font-bold text-orange-700">₹{totalSalaryExpense.toLocaleString()}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Management */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Staff Management
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="position">Position *</Label>
                      <Select 
                        value={formData.position} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {STAFF_POSITIONS.map(position => (
                            <SelectItem key={position} value={position}>{position}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="salary">Monthly Salary (₹) *</Label>
                      <Input
                        id="salary"
                        type="number"
                        min="0"
                        value={formData.salary}
                        onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="hire_date">Hire Date</Label>
                      <Input
                        id="hire_date"
                        type="date"
                        value={formData.hire_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: "active" | "inactive") => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingStaff ? "Update Staff Member" : "Add Staff Member"}
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
          <div className="space-y-4">
            {staff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No staff members added yet. Click "Add Staff" to get started.
              </div>
            ) : (
              staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      member.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      {member.status === 'active' ? 
                        <UserCheck className="w-6 h-6 text-emerald-600" /> : 
                        <UserX className="w-6 h-6 text-gray-600" />
                      }
                    </div>
                    <div>
                      <div className="font-medium text-lg">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.position}</div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {member.phone}
                        </span>
                        {member.email && (
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {member.email}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Hired: {formatDateForDisplay(member.hire_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-semibold text-lg">₹{member.salary.toLocaleString()}/mo</div>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(member.id, member.status)}
                      >
                        {member.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(member.id)}
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

export default StaffManagement;