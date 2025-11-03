import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { ComparisonRow, Item, ComparisonTableProps } from '@/lib/types';

export default function ComparisonTable({
  rows,
  items,
  vendors,
  onRowsChange,
  generalComments,
  onGeneralCommentsChange
}: ComparisonTableProps) {
  const [showCalculations, setShowCalculations] = useState(false);

  const addRow = () => {
    const newRow: ComparisonRow = {
      id: Math.random().toString(36).substr(2, 9),
      srl: rows.length + 1,
      itemId: '',
      item: {} as Item,
      description: '',
      qty: 0,
      uom: 'PCS',
      quantities: new Array(vendors.length).fill(0),
      prices: new Array(vendors.length).fill(0),
      vendor1UnitPrice: 0,
      vendor1Vat: 0,
      vendor1Total: 0,
      vendor2UnitPrice: 0,
      vendor2Vat: 0,
      vendor2Total: 0,
      vendor3UnitPrice: 0,
      vendor3Vat: 0,
      vendor3Total: 0,
      selectedVendorIndex: null,
      remarks: '',
      comment: ''
    };
    onRowsChange([...rows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<ComparisonRow>) => {
    onRowsChange(rows.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  const deleteRow = (id: string) => {
    onRowsChange(rows.filter(row => row.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Price Comparison Table</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={() => setShowCalculations(!showCalculations)} variant="outline">
              <Calculator className="h-4 w-4 mr-2" />
              {showCalculations ? 'Hide' : 'Show'} Calculations
            </Button>
            <Button onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Item</TableHead>
                  <TableHead className="w-[150px]">Description</TableHead>
                  <TableHead className="w-[100px]">Unit</TableHead>
                  {vendors.map((vendor) => (
                    <TableHead key={vendor.id} className="text-center min-w-[120px]">
                      <div className="space-y-1">
                        <div className="font-semibold">{vendor.name}</div>
                        <div className="text-xs text-gray-500">Qty | Price</div>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-[120px]">Selected</TableHead>
                  <TableHead className="w-[200px]">Remarks</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Select
                        value={row.itemId}
                        onValueChange={(value) => {
                          const selectedItem = items.find(item => item.id === value);
                          if (selectedItem) {
                            updateRow(row.id, { itemId: value, item: selectedItem });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {row.item?.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {row.item?.unit || '-'}
                      </div>
                    </TableCell>
                    {vendors.map((vendor, vendorIndex) => (
                      <TableCell key={vendor.id} className="text-center">
                        <div className="space-y-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={row.quantities[vendorIndex] || ''}
                            onChange={(e) => {
                              const newQuantities = [...row.quantities];
                              newQuantities[vendorIndex] = parseFloat(e.target.value) || 0;
                              updateRow(row.id, { quantities: newQuantities });
                            }}
                            className="text-center"
                          />
                          <Input
                            type="number"
                            placeholder="Price"
                            value={row.prices[vendorIndex] || ''}
                            onChange={(e) => {
                              const newPrices = [...row.prices];
                              newPrices[vendorIndex] = parseFloat(e.target.value) || 0;
                              updateRow(row.id, { prices: newPrices });
                            }}
                            className="text-center"
                          />
                          {showCalculations && (
                            <div className="text-xs text-gray-600 font-medium">
                              Total: ${((row.quantities[vendorIndex] || 0) * (row.prices[vendorIndex] || 0)).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell>
                      <Select
                        value={row.selectedVendorIndex?.toString() || ''}
                        onValueChange={(value) => updateRow(row.id, { selectedVendorIndex: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor, index) => (
                            <SelectItem key={vendor.id} value={index.toString()}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="Add remarks..."
                        value={row.remarks}
                        onChange={(e) => updateRow(row.id, { remarks: e.target.value })}
                        className="min-h-[60px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add general comments about this comparison..."
            value={generalComments}
            onChange={(e) => onGeneralCommentsChange(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}