import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building, Edit, Trash2, Save, X } from 'lucide-react';
import { Vendor } from '@/lib/types';
import { vendorsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface VendorManagementProps {
  vendors: Vendor[];
  onVendorsChange: (vendors: Vendor[]) => void;
}

export default function VendorManagement({ vendors, onVendorsChange }: VendorManagementProps) {
  const [newVendor, setNewVendor] = useState<Omit<Vendor, 'id' | 'createdAt' | 'isActive'>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    vat: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);

  // Load vendors from database on mount
  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await vendorsAPI.getAll();
      onVendorsChange(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load vendors');
    }
  };

  const addVendor = async () => {
    if (!newVendor.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    setLoading(true);
    try {
      const createdVendor = await vendorsAPI.create({
        ...newVendor,
        isActive: true,
      });
      onVendorsChange([...vendors, createdVendor]);
      setNewVendor({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        vat: 0
      });
      toast.success('Vendor added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditingVendor({ ...vendor });
  };

  const saveEdit = async () => {
    if (!editingVendor) return;

    setLoading(true);
    try {
      const updatedVendor = await vendorsAPI.update(editingId!, {
        name: editingVendor.name,
        contactPerson: editingVendor.contactPerson,
        email: editingVendor.email,
        phone: editingVendor.phone,
        address: editingVendor.address,
        vat: editingVendor.vat,
        isActive: editingVendor.isActive,
      });
      onVendorsChange(vendors.map(vendor => 
        vendor.id === editingId ? updatedVendor : vendor
      ));
      setEditingId(null);
      setEditingVendor(null);
      toast.success('Vendor updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update vendor');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingVendor(null);
  };

  const deleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    setLoading(true);
    try {
      await vendorsAPI.delete(id);
      onVendorsChange(vendors.filter(vendor => vendor.id !== id));
      toast.success('Vendor deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete vendor');
    } finally {
      setLoading(false);
    }
  };

  const toggleVendorStatus = async (id: string) => {
    const vendor = vendors.find(v => v.id === id);
    if (!vendor) return;

    setLoading(true);
    try {
      const updatedVendor = await vendorsAPI.update(id, { isActive: !vendor.isActive });
      onVendorsChange(vendors.map(v => 
        v.id === id ? updatedVendor : v
      ));
      toast.success(`Vendor ${updatedVendor.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update vendor status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Add New Vendor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Vendor Name *</Label>
              <Input
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                placeholder="Enter vendor name"
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={newVendor.contactPerson}
                onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                placeholder="Enter contact person"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label>VAT Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={newVendor.vat}
                onChange={(e) => setNewVendor({ ...newVendor, vat: parseFloat(e.target.value) || 0 })}
                placeholder="Enter VAT rate"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <Label>Address</Label>
              <Textarea
                value={newVendor.address}
                onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                placeholder="Enter vendor address"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={addVendor} disabled={!newVendor.name.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendors List ({vendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>VAT Rate</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      {editingId === vendor.id ? (
                        <Input
                          value={editingVendor?.name || ''}
                          onChange={(e) => setEditingVendor(prev => 
                            prev ? { ...prev, name: e.target.value } : null
                          )}
                        />
                      ) : (
                        <div className="font-medium">{vendor.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === vendor.id ? (
                        <Input
                          value={editingVendor?.contactPerson || ''}
                          onChange={(e) => setEditingVendor(prev => 
                            prev ? { ...prev, contactPerson: e.target.value } : null
                          )}
                        />
                      ) : (
                        <div>{vendor.contactPerson}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === vendor.id ? (
                        <Input
                          type="email"
                          value={editingVendor?.email || ''}
                          onChange={(e) => setEditingVendor(prev => 
                            prev ? { ...prev, email: e.target.value } : null
                          )}
                        />
                      ) : (
                        <div className="text-sm">{vendor.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === vendor.id ? (
                        <Input
                          value={editingVendor?.phone || ''}
                          onChange={(e) => setEditingVendor(prev => 
                            prev ? { ...prev, phone: e.target.value } : null
                          )}
                        />
                      ) : (
                        <div>{vendor.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === vendor.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingVendor?.vat || 0}
                          onChange={(e) => setEditingVendor(prev => 
                            prev ? { ...prev, vat: parseFloat(e.target.value) || 0 } : null
                          )}
                        />
                      ) : (
                        <Badge variant="outline">{vendor.vat}%</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === vendor.id ? (
                        <Textarea
                          value={editingVendor?.address || ''}
                          onChange={(e) => setEditingVendor(prev => 
                            prev ? { ...prev, address: e.target.value } : null
                          )}
                          className="min-h-[60px]"
                        />
                      ) : (
                        <div className="text-sm max-w-[200px] truncate">{vendor.address}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {editingId === vendor.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEdit(vendor)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleVendorStatus(vendor.id)}
                            >
                              {vendor.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteVendor(vendor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {vendors.length === 0 && (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No vendors added yet. Add your first vendor above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}