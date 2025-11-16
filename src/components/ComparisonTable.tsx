import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Calculator, X } from 'lucide-react';
import { ComparisonRow, Item, Vendor } from '@/lib/types';

interface ComparisonTableProps {
  rows: ComparisonRow[];
  items: Item[];
  vendors: Vendor[];
  allVendors: Vendor[];
  onRowsChange: (rows: ComparisonRow[]) => void;
  onAddVendor: (vendorId: string) => void;
  onRemoveVendor: (vendorId: string) => void;
  generalComments: string;
  onGeneralCommentsChange: (comments: string) => void;
}

export default function ComparisonTable({
  rows,
  items,
  vendors,
  allVendors,
  onRowsChange,
  onAddVendor,
  onRemoveVendor,
  generalComments,
  onGeneralCommentsChange
}: ComparisonTableProps) {
  const [showCalculations, setShowCalculations] = useState(false);

  const addRow = () => {
    if (!vendors.length) {
      return;
    }

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
            <Button onClick={addRow} disabled={!vendors.length} title={!vendors.length ? 'Select at least one vendor to start comparing' : undefined}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!vendors.length ? (
            <Alert>
              <AlertTitle>No vendors selected</AlertTitle>
              <AlertDescription>
                Use the vendor selector above to pick one or more vendors before building a comparison table.
              </AlertDescription>
            </Alert>
          ) : (
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
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-semibold text-sm">{vendor.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveVendor(vendor.id)}
                              className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              title="Remove vendor"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">Qty | Price</div>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[80px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Add vendor"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold mb-2">Add Vendor</p>
                            {allVendors
                              .filter((v) => !vendors.find((sv) => sv.id === v.id))
                              .map((vendor) => (
                                <Button
                                  key={vendor.id}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => onAddVendor(vendor.id)}
                                >
                                  {vendor.name}
                                </Button>
                              ))}
                            {allVendors.filter((v) => !vendors.find((sv) => sv.id === v.id)).length === 0 && (
                              <p className="text-sm text-muted-foreground py-2">All vendors added</p>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
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
                      <TableCell className="text-center">
                        {/* Empty cell for + vendor column */}
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
          )}
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