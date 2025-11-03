import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Item, UOMType } from '@/lib/types';

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
    category: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const addItem = () => {
    if (!newItem.name.trim()) return;

    const item: Item = {
      id: Math.random().toString(36).substr(2, 9),
      ...newItem,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    onItemsChange([...items, item]);
    setNewItem({
      name: '',
      description: '',
      specification: '',
      unit: 'NOS',
      category: ''
    });
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditingItem({ ...item });
  };

  const saveEdit = () => {
    if (!editingItem) return;

    onItemsChange(items.map(item => 
      item.id === editingId ? editingItem : item
    ));
    setEditingId(null);
    setEditingItem(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingItem(null);
  };

  const deleteItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const toggleItemStatus = (id: string) => {
    onItemsChange(items.map(item => 
      item.id === id ? { ...item, isActive: !item.isActive } : item
    ));
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