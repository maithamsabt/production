import { ComparisonRow, Vendor, AppSettings } from './types';

export interface ExportData {
  rows: ComparisonRow[];
  vendors: Vendor[];
  settings: AppSettings;
  generalComments: string;
  totals: {
    vendor1: number;
    vendor2: number;
    vendor3: number;
  };
  lowestBidder: {
    name: string;
    total: number;
    index: number;
  };
}

export const calculateRowTotal = (
  qty: number,
  unitPrice: number,
  vatRate: number
): number => {
  return qty * unitPrice * (1 + vatRate);
};

export const calculateVendorTotal = (
  rows: ComparisonRow[],
  vendorIndex: number
): number => {
  return rows.reduce((total, row) => {
    switch (vendorIndex) {
      case 1:
        return total + row.vendor1Total;
      case 2:
        return total + row.vendor2Total;
      case 3:
        return total + row.vendor3Total;
      default:
        return total;
    }
  }, 0);
};

export const findLowestBidder = (
  rows: ComparisonRow[],
  vendors: Vendor[]
): { name: string; total: number; index: number } => {
  const totals = [
    { name: vendors[0]?.name || 'Vendor 1', total: calculateVendorTotal(rows, 1), index: 0 },
    { name: vendors[1]?.name || 'Vendor 2', total: calculateVendorTotal(rows, 2), index: 1 },
    { name: vendors[2]?.name || 'Vendor 3', total: calculateVendorTotal(rows, 3), index: 2 }
  ];
  
  return totals.reduce((lowest, current) => 
    current.total > 0 && (lowest.total === 0 || current.total < lowest.total) ? current : lowest
  );
};

export const formatCurrency = (amount: number, decimals: number = 3): string => {
  return amount.toFixed(decimals);
};

export const formatPercentage = (rate: number): string => {
  return (rate * 100).toFixed(1) + '%';
};

export const generateRequestNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `REQ-${year}${month}${day}-${random}`;
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const validateComparisonData = (
  rows: ComparisonRow[],
  vendors: Vendor[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (rows.length === 0) {
    errors.push('At least one comparison row is required');
  }

  if (vendors.length < 2) {
    errors.push('At least two vendors are required for comparison');
  }

  rows.forEach((row, index) => {
    if (!row.description.trim()) {
      errors.push(`Row ${index + 1}: Description is required`);
    }
    
    if (row.qty <= 0) {
      errors.push(`Row ${index + 1}: Quantity must be greater than 0`);
    }
    
    if (!row.uom.trim()) {
      errors.push(`Row ${index + 1}: Unit of measure is required`);
    }
  });

  vendors.forEach((vendor, index) => {
    if (!vendor.name.trim()) {
      errors.push(`Vendor ${index + 1}: Name is required`);
    }
    
    if (vendor.vat < 0) {
      errors.push(`Vendor ${index + 1}: VAT rate cannot be negative`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateSavings = (
  lowestTotal: number,
  highestTotal: number
): { amount: number; percentage: number } => {
  if (lowestTotal === 0 || highestTotal === 0) {
    return { amount: 0, percentage: 0 };
  }

  const amount = highestTotal - lowestTotal;
  const percentage = (amount / lowestTotal) * 100;

  return { amount, percentage };
};

export const prepareExportData = (
  rows: ComparisonRow[],
  vendors: Vendor[],
  settings: AppSettings,
  generalComments: string
): ExportData => {
  const totals = {
    vendor1: calculateVendorTotal(rows, 1),
    vendor2: calculateVendorTotal(rows, 2),
    vendor3: calculateVendorTotal(rows, 3)
  };

  const lowestBidder = findLowestBidder(rows, vendors);

  return {
    rows,
    vendors,
    settings: {
      ...settings,
      reqNo: settings.reqNo || generateRequestNumber(),
      date: settings.date || getCurrentDate()
    },
    generalComments,
    totals,
    lowestBidder
  };
};

export const generateComparisonSummary = (
  rows: ComparisonRow[],
  vendors: Vendor[]
): string => {
  const totals = {
    vendor1: calculateVendorTotal(rows, 1),
    vendor2: calculateVendorTotal(rows, 2),
    vendor3: calculateVendorTotal(rows, 3)
  };

  const lowestBidder = findLowestBidder(rows, vendors);
  const highestTotal = Math.max(totals.vendor1, totals.vendor2, totals.vendor3);
  const savings = calculateSavings(lowestBidder.total, highestTotal);

  let summary = `Comparison Summary:\n`;
  summary += `- Total Items: ${rows.length}\n`;
  summary += `- Vendors Compared: ${vendors.length}\n`;
  summary += `- Lowest Bidder: ${lowestBidder.name} (${formatCurrency(lowestBidder.total)})\n`;
  
  if (savings.amount > 0) {
    summary += `- Potential Savings: ${formatCurrency(savings.amount)} (${savings.percentage.toFixed(1)}%)\n`;
  }

  return summary;
};

// Export utility functions for CSV/Excel export
export const convertToCSV = (data: ExportData): string => {
  const headers = [
    'SRL',
    'Description',
    'Qty',
    'UOM',
    `${data.vendors[0]?.name || 'Vendor 1'} - Unit Price`,
    `${data.vendors[0]?.name || 'Vendor 1'} - VAT %`,
    `${data.vendors[0]?.name || 'Vendor 1'} - Total`,
    `${data.vendors[1]?.name || 'Vendor 2'} - Unit Price`,
    `${data.vendors[1]?.name || 'Vendor 2'} - VAT %`,
    `${data.vendors[1]?.name || 'Vendor 2'} - Total`,
    `${data.vendors[2]?.name || 'Vendor 3'} - Unit Price`,
    `${data.vendors[2]?.name || 'Vendor 3'} - VAT %`,
    `${data.vendors[2]?.name || 'Vendor 3'} - Total`,
    'Comment'
  ];

  const csvRows = [headers.join(',')];

  data.rows.forEach(row => {
    const rowData = [
      row.srl,
      `"${row.description}"`,
      row.qty,
      row.uom,
      row.vendor1UnitPrice,
      (row.vendor1Vat * 100).toFixed(1),
      row.vendor1Total,
      row.vendor2UnitPrice,
      (row.vendor2Vat * 100).toFixed(1),
      row.vendor2Total,
      row.vendor3UnitPrice,
      (row.vendor3Vat * 100).toFixed(1),
      row.vendor3Total,
      `"${row.comment}"`
    ];
    csvRows.push(rowData.join(','));
  });

  // Add totals row
  const totalsRow = [
    '',
    '"TOTAL"',
    '',
    '',
    '',
    '',
    data.totals.vendor1,
    '',
    '',
    data.totals.vendor2,
    '',
    '',
    data.totals.vendor3,
    ''
  ];
  csvRows.push(totalsRow.join(','));

  return csvRows.join('\n');
};

export const downloadCSV = (filename: string) => {
  // This function would be implemented to trigger CSV download
  console.log(`Downloading CSV: ${filename}`);
};