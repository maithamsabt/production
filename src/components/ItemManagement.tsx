import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Item, UOMType } from '@/lib/types';
import { itemsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface ItemManagementProps {
  items: Item[];
  onItemsChange: (items: Item[]) => void;
}

const UOM_OPTIONS: UOMType[] = ['NOS', 'PCS', 'SET', 'KG', 'M', 'L'];
const CATEGORY_OPTIONS = ['Electronics', 'Office Supplies', 'Hardware', 'Software', 'Services', 'Other'];

export default function ItemManagement({ items, onItemsChange }: ItemManagementProps) {
  const [newItem, setNewItem] = useState<Omit<Item, 'id' | 'createdAt' | 'isActive'>>({
    name: '',
    description: '',
    specification: '',
    unit: 'NOS',
    category: '',
    isVatable: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [_isLoading, setIsLoading] = useState(false);

  // Load items from database on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await itemsAPI.getAll();
      onItemsChange(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load items');
    }
  };

  const addItem = async () => {
    if (!newItem.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    setIsLoading(true);
    try {
      const createdItem = await itemsAPI.create({
        ...newItem,
        isActive: true,
      });
      onItemsChange([...items, createdItem]);
      setNewItem({
        name: '',
        description: '',
        specification: '',
        unit: 'NOS',
        category: '',
        isVatable: true
      });
      toast.success('Item added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditingItem({ ...item });
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    setIsLoading(true);
    try {
      const updatedItem = await itemsAPI.update(editingId!, {
        name: editingItem.name,
        description: editingItem.description,
        specification: editingItem.specification,
        unit: editingItem.unit,
        category: editingItem.category,
        isActive: editingItem.isActive,
      });
      onItemsChange(items.map(item => 
        item.id === editingId ? updatedItem : item
      ));
      setEditingId(null);
      setEditingItem(null);
      toast.success('Item updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingItem(null);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setIsLoading(true);
    try {
      await itemsAPI.delete(id);
      onItemsChange(items.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemStatus = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    setIsLoading(true);
    try {
      const updatedItem = await itemsAPI.update(id, { isActive: !item.isActive });
      onItemsChange(items.map(i => 
        i.id === id ? updatedItem : i
      ));
      toast.success(`Item ${updatedItem.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Item Name *</label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unit of Measure</label>
              <Select
                value={newItem.unit}
                onValueChange={(value: UOMType) => setNewItem({ ...newItem, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map((uom) => (
                    <SelectItem key={uom} value={uom}>
                      {uom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={newItem.category}
                onValueChange={(value) => setNewItem({ ...newItem, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Enter item description"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium">Specification</label>
              <Textarea
                value={newItem.specification}
                onChange={(e) => setNewItem({ ...newItem, specification: e.target.value })}
                placeholder="Enter detailed specifications"
                className="min-h-[80px]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vatable"
                checked={newItem.isVatable}
                onCheckedChange={(checked) => setNewItem({ ...newItem, isVatable: checked as boolean })}
              />
              <Label htmlFor="vatable" className="text-sm font-medium cursor-pointer">
                Subject to VAT
              </Label>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={addItem} disabled={!newItem.name.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items List ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Specification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          value={editingItem?.name || ''}
                          onChange={(e) => setEditingItem(prev => 
                            prev ? { ...prev, name: e.target.value } : null
                          )}
                        />
                      ) : (
                        <div className="font-medium">{item.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          value={editingItem?.description || ''}
                          onChange={(e) => setEditingItem(prev => 
                            prev ? { ...prev, description: e.target.value } : null
                          )}
                        />
                      ) : (
                        <div className="text-sm text-gray-600">{item.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Select
                          value={editingItem?.category || ''}
                          onValueChange={(value) => setEditingItem(prev => 
                            prev ? { ...prev, category: value } : null
                          )}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge>{item.unit}</Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Checkbox
                          checked={editingItem?.isVatable || false}
                          onCheckedChange={(checked) => setEditingItem(prev => 
                            prev ? { ...prev, isVatable: checked as boolean } : null
                          )}
                        />
                      ) : (
                        <Badge variant={item.isVatable ? 'default' : 'secondary'}>
                          {item.isVatable ? 'Yes' : 'No'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Textarea
                          value={editingItem?.specification || ''}
                          onChange={(e) => setEditingItem(prev => 
                            prev ? { ...prev, specification: e.target.value } : null
                          )}
                          className="min-h-[60px]"
                        />
                      ) : (
                        <div className="text-sm text-gray-600 max-w-[200px] truncate">
                          {item.specification}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {editingId === item.id ? (
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
                            <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleItemStatus(item.id)}
                            >
                              {item.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteItem(item.id)}
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
          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No items added yet. Add your first item above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}