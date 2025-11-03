import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Printer, Download } from 'lucide-react';
import { PrintViewProps } from '@/lib/types';

export default function PrintView({ rows, vendors, settings, currentUser, generalComments }: PrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // In a real application, this would generate and download a PDF
    console.log('Downloading PDF...');
  };

  const calculateTotal = (row: any, vendorIndex: number) => {
    const quantity = row.quantities?.[vendorIndex] || 0;
    const price = row.prices?.[vendorIndex] || 0;
    return quantity * price;
  };

  const getVendorTotal = (vendorIndex: number) => {
    return rows.reduce((total, row) => total + calculateTotal(row, vendorIndex), 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between print:hidden">
          <CardTitle>Print Preview</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="print:p-0">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">{settings.companyName}</h1>
              <p className="text-gray-600">{settings.companyAddress}</p>
              <p className="text-gray-600">Phone: {settings.companyPhone} | Email: {settings.companyEmail}</p>
              <Separator className="my-4" />
              <h2 className="text-xl font-semibold">Price Comparison Sheet</h2>
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p><strong>Request No:</strong> {settings.reqNo}</p>
                <p><strong>Date:</strong> {settings.date}</p>
                <p><strong>Purpose:</strong> {settings.purpose}</p>
              </div>
              <div>
                <p><strong>Prepared by:</strong> {settings.makerName}</p>
                <p><strong>Checked by:</strong> {settings.checkerName}</p>
                <p><strong>Current User:</strong> {currentUser.name}</p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border">Item</TableHead>
                    <TableHead className="border">Description</TableHead>
                    <TableHead className="border">UOM</TableHead>
                    {vendors.map((vendor) => (
                      <TableHead key={vendor.id} className="border text-center">
                        {vendor.name}
                      </TableHead>
                    ))}
                    <TableHead className="border">Selected</TableHead>
                    <TableHead className="border">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="border">{row.item?.name || '-'}</TableCell>
                      <TableCell className="border">{row.item?.description || '-'}</TableCell>
                      <TableCell className="border">{row.item?.unit || '-'}</TableCell>
                      {vendors.map((vendor, vendorIndex) => (
                        <TableCell key={vendor.id} className="border text-center">
                          <div>
                            <div>Qty: {row.quantities?.[vendorIndex] || 0}</div>
                            <div>Price: ${row.prices?.[vendorIndex] || 0}</div>
                            <div className="font-semibold">
                              Total: ${calculateTotal(row, vendorIndex).toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="border">
                        {row.selectedVendorIndex !== null && row.selectedVendorIndex !== undefined
                          ? vendors[row.selectedVendorIndex]?.name || '-'
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="border">{row.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                {vendors.map((vendor, index) => (
                  <div key={vendor.id} className="text-center p-4 border rounded">
                    <div className="font-semibold">{vendor.name}</div>
                    <div className="text-xl font-bold text-blue-600">
                      ${getVendorTotal(index).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Comments */}
            {generalComments && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">General Comments</h3>
                <div className="p-4 border rounded bg-gray-50">
                  {generalComments}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <div className="border-b border-black pb-1 mb-2 h-16"></div>
                <p className="text-center">
                  <strong>Prepared by:</strong><br />
                  {settings.makerName}<br />
                  Date: ___________
                </p>
              </div>
              <div>
                <div className="border-b border-black pb-1 mb-2 h-16">
                  {settings.checkerSignature && (
                    <img 
                      src={settings.checkerSignature} 
                      alt="Signature" 
                      className="h-full object-contain mx-auto"
                    />
                  )}
                </div>
                <p className="text-center">
                  <strong>Checked by:</strong><br />
                  {settings.checkerName}<br />
                  Date: ___________
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}