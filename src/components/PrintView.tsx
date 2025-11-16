import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-2 backdrop-blur-sm bg-card/95 print:shadow-none print:border-0">
        <CardHeader className="flex flex-row items-center justify-between print:hidden border-b bg-muted/30">
          <CardTitle className="text-xl font-semibold">Print Preview</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent className="print:p-8">
          {/* Print-specific styles */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-content, .print-content * {
                visibility: visible;
              }
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
              }
              .print-content * {
                background: white !important;
                color: black !important;
              }
              .print-content table {
                background: white !important;
              }
              .print-content th,
              .print-content td {
                background: white !important;
                color: black !important;
              }
              .print-content .bg-gray-100 {
                background: #f3f4f6 !important;
              }
              .print-content .bg-gray-50 {
                background: #f9fafb !important;
              }
              .print-content .bg-gray-200 {
                background: #e5e7eb !important;
              }
              @page {
                margin: 1.5cm;
                size: A4;
              }
              .page-break {
                page-break-before: always;
              }
              table {
                border-collapse: collapse !important;
              }
              th, td {
                border: 1px solid #000 !important;
                padding: 8px !important;
              }
            }
          `}</style>

          <div className="print-content">
            {/* Official Document Header */}
            <div className="text-center mb-8 pb-4 border-b-4 border-double border-primary">
              <div className="mb-3">
                <h1 className="text-3xl font-bold text-primary uppercase tracking-wide">{settings.companyName}</h1>
                <div className="text-sm text-foreground/80 mt-2 space-y-1">
                  <p>{settings.companyAddress}</p>
                  <p>Tel: {settings.companyPhone} | Email: {settings.companyEmail}</p>
                </div>
              </div>
              <div className="mt-4">
                <h2 className="text-2xl font-bold uppercase tracking-wide border-t-2 border-b-2 border-primary py-2 inline-block px-8">
                  Price Comparison Quotation
                </h2>
              </div>
            </div>

            {/* Document Reference Information */}
            <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-semibold w-32">Request No:</span>
                  <span className="border-b border-dotted border-border flex-1 px-2">{settings.reqNo}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Date:</span>
                  <span className="border-b border-dotted border-border flex-1 px-2">{settings.date || currentDate}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Purpose:</span>
                  <span className="border-b border-dotted border-border flex-1 px-2">{settings.purpose}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-semibold w-32">Prepared by:</span>
                  <span className="border-b border-dotted border-border flex-1 px-2">{settings.makerName}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Checked by:</span>
                  <span className="border-b border-dotted border-border flex-1 px-2">{settings.checkerName}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Reviewed by:</span>
                  <span className="border-b border-dotted border-border flex-1 px-2">{currentUser.name}</span>
                </div>
              </div>
            </div>

            {/* Professional Comparison Table */}
            <div className="mb-8">
              <table className="w-full border-2 border-foreground text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border-2 border-foreground p-3 text-left font-bold" rowSpan={2}>S/N</th>
                    <th className="border-2 border-foreground p-3 text-left font-bold" rowSpan={2}>Item Description</th>
                    <th className="border-2 border-foreground p-3 text-center font-bold" rowSpan={2}>Unit</th>
                    {vendors.map((vendor) => (
                      <th key={vendor.id} className="border-2 border-foreground p-3 text-center font-bold" colSpan={3}>
                        {vendor.name.toUpperCase()}
                      </th>
                    ))}
                    <th className="border-2 border-foreground p-3 text-center font-bold" rowSpan={2}>Remarks</th>
                  </tr>
                  <tr className="bg-muted/50">
                    {vendors.map((vendor) => (
                      <>
                        <th key={`${vendor.id}-qty`} className="border-2 border-foreground p-2 text-center text-xs font-semibold">Qty</th>
                        <th key={`${vendor.id}-price`} className="border-2 border-foreground p-2 text-center text-xs font-semibold">Unit Price</th>
                        <th key={`${vendor.id}-total`} className="border-2 border-foreground p-2 text-center text-xs font-semibold">Total</th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="border-2 border-foreground p-2 text-center font-semibold">{index + 1}</td>
                      <td className="border-2 border-foreground p-2">
                        <div className="font-semibold">{row.item?.name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{row.item?.description || ''}</div>
                      </td>
                      <td className="border-2 border-foreground p-2 text-center">{row.item?.unit || '-'}</td>
                      {vendors.map((vendor, vendorIndex) => (
                        <>
                          <td key={`${vendor.id}-${vendorIndex}-qty`} className="border-2 border-foreground p-2 text-center">
                            {row.quantities?.[vendorIndex] || '-'}
                          </td>
                          <td key={`${vendor.id}-${vendorIndex}-price`} className="border-2 border-foreground p-2 text-right">
                            {(row.prices?.[vendorIndex] || 0).toFixed(3)} BHD
                          </td>
                          <td key={`${vendor.id}-${vendorIndex}-total`} className="border-2 border-foreground p-2 text-right font-semibold">
                            {calculateTotal(row, vendorIndex).toFixed(3)} BHD
                          </td>
                        </>
                      ))}
                      <td className="border-2 border-foreground p-2 text-xs">{row.remarks || '-'}</td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-muted font-bold">
                    <td colSpan={3} className="border-2 border-foreground p-3 text-right uppercase">Grand Total:</td>
                    {vendors.map((vendor, index) => (
                      <>
                        <td key={`${vendor.id}-total-qty`} className="border-2 border-foreground"></td>
                        <td key={`${vendor.id}-total-price`} className="border-2 border-foreground"></td>
                        <td key={`${vendor.id}-total-amount`} className="border-2 border-foreground p-3 text-right text-lg">
                          {getVendorTotal(index).toFixed(3)} BHD
                        </td>
                      </>
                    ))}
                    <td className="border-2 border-foreground"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* General Comments */}
            {generalComments && (
              <div className="mb-8">
                <h3 className="font-bold text-sm mb-2 uppercase border-b-2 border-border pb-1">General Comments:</h3>
                <div className="p-4 border-2 border-border rounded bg-muted/30 text-sm whitespace-pre-wrap">
                  {generalComments}
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="mt-12 grid grid-cols-3 gap-8 pt-8 border-t-2 border-border">
              <div className="text-center">
                <div className="border-b-2 border-foreground pb-1 mb-2 h-20 flex items-end justify-center">
                  {/* Signature space */}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-bold">PREPARED BY</p>
                  <p>{settings.makerName}</p>
                  <p className="text-xs">Date: ______________</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-foreground pb-1 mb-2 h-20 flex items-end justify-center">
                  {settings.checkerSignature && (
                    <img 
                      src={settings.checkerSignature} 
                      alt="Signature" 
                      className="h-full object-contain"
                    />
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-bold">CHECKED BY</p>
                  <p>{settings.checkerName}</p>
                  <p className="text-xs">Date: ______________</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-foreground pb-1 mb-2 h-20 flex items-end justify-center">
                  {/* Signature space */}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-bold">APPROVED BY</p>
                  <p>_________________</p>
                  <p className="text-xs">Date: ______________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground">
              <p>This is an official document generated by {settings.companyName} Procurement System</p>
              <p>Document Reference: {settings.reqNo} | Generated on: {currentDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}