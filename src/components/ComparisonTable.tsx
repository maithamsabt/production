import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Calculator, X, Send, AlertCircle } from 'lucide-react';
import { ComparisonRow, Item, Vendor } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import { comparisonsAPI } from '@/lib/api/comparisons';

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
  currentComparisonId?: string | null;
  requestNumber?: string;
  title?: string;
  comparisonStatus?: string;
  onComparisonSaved?: (id: string) => void;
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
  onGeneralCommentsChange,
  currentComparisonId,
  requestNumber,
  title,
  comparisonStatus,
  onComparisonSaved
}: ComparisonTableProps) {
  const [showCalculations, setShowCalculations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [comparisonTitle, setComparisonTitle] = useState(title || '');
  
  // Determine if comparison is readonly (processed or in-process)
  const isReadonly = Boolean(comparisonStatus && comparisonStatus !== 'draft');
  
  // Auto-generate request number based on current date and time
  const generateRequestNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime();
    return `REQ-${year}${month}${day}-${timestamp.toString().slice(-6)}`;
  };

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

  const handleSaveComparison = async () => {
    if (rows.length === 0) {
      toast({
        title: "Cannot save",
        description: "Please add at least one item to the comparison.",
        variant: "destructive",
      });
      return;
    }

    if (vendors.length === 0) {
      toast({
        title: "Cannot save",
        description: "Please select at least one vendor.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const comparisonData = {
        requestNumber: requestNumber || generateRequestNumber(),
        title: comparisonTitle || 'Price Comparison',
        selectedVendors: vendors.map(v => v.id),
        rows: rows.map(row => ({
          itemId: row.itemId,
          quantities: row.quantities,
          prices: row.prices,
          remarks: row.remarks,
        })),
        generalComments,
        status: 'draft',
      };

      let comparisonId = currentComparisonId;
      
      if (comparisonId) {
        await comparisonsAPI.update(comparisonId, comparisonData);
        toast({
          title: "Comparison updated",
          description: "Your changes have been saved successfully.",
        });
      } else {
        const created = await comparisonsAPI.create(comparisonData);
        comparisonId = created.id;
        if (onComparisonSaved && comparisonId) {
          onComparisonSaved(comparisonId);
        }
        toast({
          title: "Comparison created",
          description: "Your comparison has been saved successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save the comparison. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitToChecker = async () => {
    if (!currentComparisonId) {
      toast({
        title: "Cannot submit",
        description: "Please save the comparison first before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (rows.length === 0) {
      toast({
        title: "Cannot submit",
        description: "Please add at least one item to the comparison.",
        variant: "destructive",
      });
      return;
    }

    if (vendors.length === 0) {
      toast({
        title: "Cannot submit",
        description: "Please select at least one vendor.",
        variant: "destructive",
      });
      return;
    }

    const invalidRows = rows.filter(row => !row.itemId);
    if (invalidRows.length > 0) {
      toast({
        title: "Cannot submit",
        description: "Please select items for all rows.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First save any pending changes
      await handleSaveComparison();
      
      // Then submit for review
      await comparisonsAPI.submit(currentComparisonId);

      toast({
        title: "Successfully submitted",
        description: "The invoice has been submitted to the checker for review.",
      });
      
      if (onComparisonSaved) {
        onComparisonSaved(currentComparisonId);
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isReadonly && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Read-Only Mode</AlertTitle>
          <AlertDescription>
            This comparison is {comparisonStatus === 'submitted' ? 'in review' : comparisonStatus}. 
            You can view and print it, but editing is not allowed.
          </AlertDescription>
        </Alert>
      )}
      
      {!isReadonly && (
        <Card className="shadow-lg border-2 backdrop-blur-sm bg-card/95">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold">Comparison Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Comparison Title / Name</label>
              <Input
                type="text"
                placeholder="e.g., Office Supplies Comparison Q4 2024"
                value={comparisonTitle}
                onChange={(e) => setComparisonTitle(e.target.value)}
                disabled={isReadonly}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">Request number will be auto-generated when you save</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-lg border-2 backdrop-blur-sm bg-card/95">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
          <CardTitle className="text-xl font-semibold">
            {isReadonly ? 'Price Comparison Table (Read-Only)' : 'Price Comparison Table'}
          </CardTitle>
          <div className="flex space-x-2">
            <Button onClick={() => setShowCalculations(!showCalculations)} variant="outline" className="gap-2 shadow-sm">
              <Calculator className="h-4 w-4" />
              {showCalculations ? 'Hide' : 'Show'} Calculations
            </Button>
            {!isReadonly && (
              <Button onClick={addRow} disabled={!vendors.length} title={!vendors.length ? 'Select at least one vendor to start comparing' : undefined} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
            )}
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
                            {!isReadonly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveVendor(vendor.id)}
                                className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-all"
                                title="Remove vendor"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Qty | Price</div>
                        </div>
                      </TableHead>
                    ))}
                    {!isReadonly && (
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
                    )}
                    <TableHead className="border-r border-t border-l bg-muted/50 font-semibold">Remarks</TableHead>
                    {!isReadonly && (
                      <TableHead className="border-r border-t bg-muted/50 font-semibold">Actions</TableHead>
                    )}
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
                          disabled={isReadonly}
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
                              disabled={isReadonly}
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
                              disabled={isReadonly}
                            />
                            {showCalculations && (
                              <div className="text-xs text-gray-600 font-medium">
                                Total: {((row.quantities[vendorIndex] || 0) * (row.prices[vendorIndex] || 0)).toFixed(3)} BHD
                              </div>
                            )}
                          </div>
                        </TableCell>
                      ))}
                      {!isReadonly && (
                        <TableCell className="text-center border-r border-l">
                          {/* Empty cell for + vendor column */}
                        </TableCell>
                      )}
                      <TableCell className="border-r">
                        <Textarea
                          placeholder="Add remarks..."
                          value={row.remarks}
                          onChange={(e) => updateRow(row.id, { remarks: e.target.value })}
                          className="min-h-[60px]"
                          disabled={isReadonly}
                        />
                      </TableCell>
                      {!isReadonly && (
                        <TableCell className="border-r">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRow(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
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
            disabled={isReadonly}
          />
        </CardContent>
      </Card>

      {!isReadonly ? (
        <Card className="shadow-lg border-2 backdrop-blur-sm bg-card/95 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Ready to submit?</h3>
                <p className="text-sm text-muted-foreground">
                  {currentComparisonId 
                    ? "Save changes and submit this invoice to the checker for review and approval."
                    : "Save this comparison first, then submit it to the checker for review."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveComparison}
                  disabled={isSaving || rows.length === 0 || vendors.length === 0}
                  size="lg"
                  variant="outline"
                  className="gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  onClick={handleSubmitToChecker}
                  disabled={isSubmitting || isSaving || !currentComparisonId || rows.length === 0 || vendors.length === 0}
                  size="lg"
                  className="gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Send className="h-5 w-5" />
                  {isSubmitting ? "Submitting..." : "Submit to Checker"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-2 backdrop-blur-sm bg-card/95">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Comparison Status</h3>
                <p className="text-sm text-muted-foreground">
                  This comparison is <span className="font-semibold capitalize">{comparisonStatus}</span>. 
                  {comparisonStatus === 'submitted' && ' Waiting for checker review.'}
                  {comparisonStatus === 'approved' && ' It has been approved.'}
                  {comparisonStatus === 'rejected' && ' It has been rejected.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}