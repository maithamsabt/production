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
      <Card className="shadow-lg border-2 backdrop-blur-sm bg-card/95">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
          <CardTitle className="text-xl font-semibold">Price Comparison Table</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={() => setShowCalculations(!showCalculations)} variant="outline" className="gap-2 shadow-sm">
              <Calculator className="h-4 w-4" />
              {showCalculations ? 'Hide' : 'Show'} Calculations
            </Button>
            <Button onClick={addRow} disabled={!vendors.length} title={!vendors.length ? 'Select at least one vendor to start comparing' : undefined} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
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
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b-2">
                    <TableHead className="border-r border-l border-t bg-muted/50 font-semibold">Item</TableHead>
                    <TableHead className="border-r border-t bg-muted/50 font-semibold">Description</TableHead>
                    <TableHead className="border-r border-t bg-muted/50 font-semibold">Unit</TableHead>
                    {vendors.map((vendor) => (
                      <TableHead key={vendor.id} className="text-center min-w-[120px] border-r border-t bg-muted/50">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-semibold text-sm">{vendor.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveVendor(vendor.id)}
                              className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-all"
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
                            className="h-8 w-8 p-0 rounded-full hover:scale-110 transition-transform shadow-sm"
                            title="Add vendor"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 shadow-xl" align="start">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold mb-2 px-2">Add Vendor</p>
                            {allVendors
                              .filter((v) => !vendors.find((sv) => sv.id === v.id))
                              .map((vendor) => (
                                <Button
                                  key={vendor.id}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start hover:bg-primary/10 transition-colors"
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
                    <TableHead className="border-r border-t border-l bg-muted/50 font-semibold">Remarks</TableHead>
                    <TableHead className="border-r border-t bg-muted/50 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40 transition-colors border-b">
                      <TableCell className="border-r border-l">
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
                      <TableCell className="border-r">
                        <div className="text-sm">
                          {row.item?.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="text-sm">
                          {row.item?.unit || '-'}
                        </div>
                      </TableCell>
                      {vendors.map((vendor, vendorIndex) => (
                        <TableCell key={vendor.id} className="text-center border-r">
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
                      <TableCell className="text-center border-r border-l">
                        {/* Empty cell for + vendor column */}
                      </TableCell>
                      <TableCell className="border-r">
                        <Textarea
                          placeholder="Add remarks..."
                          value={row.remarks}
                          onChange={(e) => updateRow(row.id, { remarks: e.target.value })}
                          className="min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell className="border-r">
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

      <Card className="shadow-lg border-2 backdrop-blur-sm bg-card/95">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">General Comments</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Textarea
            placeholder="Add general comments about this comparison..."
            value={generalComments}
            onChange={(e) => onGeneralCommentsChange(e.target.value)}
            className="min-h-[100px] resize-none focus-visible:ring-2"
          />
        </CardContent>
      </Card>
    </div>
  );
}