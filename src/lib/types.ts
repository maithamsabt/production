// Re-export AuthUser as User for backward compatibility
import type { AuthUser } from './auth';
export type User = AuthUser;

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  vat: number;
  isActive: boolean;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  specification: string;
  unit: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface ComparisonRow {
  id: string;
  srl: number;
  itemId: string;
  item: Item;
  description: string;
  qty: number;
  uom: string;
  quantities: number[];
  prices: number[];
  vendor1UnitPrice: number;
  vendor1Vat: number;
  vendor1Total: number;
  vendor2UnitPrice: number;
  vendor2Vat: number;
  vendor2Total: number;
  vendor3UnitPrice: number;
  vendor3Vat: number;
  vendor3Total: number;
  selectedVendorIndex: number | null;
  remarks: string;
  comment: string;
}

export interface ComparisonHistory {
  id: string;
  title: string;
  comparisonData: ComparisonRow[];
  vendors: Vendor[];
  generalComments: string;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  defaultVat: number;
  reqNo: string;
  date: string;
  makerName: string;
  checkerName: string;
  checkerSignature?: string;
  purpose: string;
  requestNumber: string;
}

export type UOMType = 'NOS' | 'PCS' | 'SET' | 'KG' | 'M' | 'L' | 'pcs' | 'kg' | 'lbs' | 'meters' | 'feet' | 'liters' | 'gallons' | 'boxes' | 'sets' | 'units' | 'rolls' | 'sheets' | 'tons' | 'hours' | 'days' | 'months' | 'years';

export type ComparisonStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ComparisonSheet {
  id: string;
  requestNumber: string;
  title: string;
  status: ComparisonStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  rows: ComparisonRow[];
  vendors: Vendor[];
  generalComments: string;
  settings: AppSettings;
  version: number;
  originalId?: string;
}

export interface PrintViewProps {
  rows: ComparisonRow[];
  vendors: Vendor[];
  settings: AppSettings;
  currentUser: User;
  generalComments: string;
}

export interface SignatureUploadProps {
  currentUser: User;
}

export interface ComparisonTableProps {
  rows: ComparisonRow[];
  items: Item[];
  vendors: Vendor[];
  onRowsChange: (rows: ComparisonRow[]) => void;
  generalComments: string;
  onGeneralCommentsChange: (comments: string) => void;
}

export interface ComparisonHistoryProps {
  currentUser: User;
}

export interface AttachmentManagerProps {
  currentUser: { username: string };
}