import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  History,
  Package,
  Building,
  Paperclip,
  Printer,
  PenTool,
  Users,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

import LoginForm from '@/components/LoginForm';
import ComparisonTable from '@/components/ComparisonTable';
import ComparisonHistory from '@/components/ComparisonHistory';
import ItemManagement from '@/components/ItemManagement';
import VendorManagement from '@/components/VendorManagement';
import AttachmentManager from '@/components/AttachmentManager';
import PrintView from '@/components/PrintView';
import UserManagement from '@/components/UserManagement';
import Settings from '@/components/Settings';
import { ThemeToggle } from '@/components/theme-toggle';

import { Vendor, Item, ComparisonRow, AppSettings } from '@/lib/types';
import { authService } from '@/lib/auth';
import { vendorsAPI, itemsAPI } from '@/lib/api';
import type { User } from '@/lib/types';
import { getPermissions } from '@/lib/permissions';

const remapRowsForVendors = (
  rows: ComparisonRow[],
  previousVendorIds: string[],
  nextVendorIds: string[]
): ComparisonRow[] => {
  if (!rows.length) {
    return rows;
  }

  return rows.map((row) => {
    const vendorValueMap = previousVendorIds.reduce<Record<string, { quantity: number; price: number }>>((acc, vendorId, index) => {
      acc[vendorId] = {
        quantity: row.quantities?.[index] ?? 0,
        price: row.prices?.[index] ?? 0
      };
      return acc;
    }, {});

    const updatedQuantities = nextVendorIds.map((vendorId) => vendorValueMap[vendorId]?.quantity ?? 0);
    const updatedPrices = nextVendorIds.map((vendorId) => vendorValueMap[vendorId]?.price ?? 0);

    const previousSelectedVendorId =
      row.selectedVendorIndex !== null && row.selectedVendorIndex !== undefined
        ? previousVendorIds[row.selectedVendorIndex]
        : null;

    const nextSelectedIndex = previousSelectedVendorId ? nextVendorIds.indexOf(previousSelectedVendorId) : -1;

    return {
      ...row,
      quantities: updatedQuantities,
      prices: updatedPrices,
      selectedVendorIndex: nextSelectedIndex >= 0 ? nextSelectedIndex : null
    };
  });
};

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('comparison');
  const [initialized, setInitialized] = useState(false);

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [generalComments, setGeneralComments] = useState('');

  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'Your Company Name',
    companyAddress: 'Company Address',
    companyPhone: '+1-234-567-8900',
    companyEmail: 'info@company.com',
    defaultVat: 10,
    reqNo: '',
    date: '',
    makerName: '',
    checkerName: '',
    checkerSignature: '',
    purpose: 'Procurement Comparison',
    requestNumber: ''
  });

  // Load data from database
  const loadDataFromDatabase = async () => {
    try {
      const [vendorsData, itemsData] = await Promise.all([
        vendorsAPI.getAll(),
        itemsAPI.getAll(),
      ]);
      
      setVendors(vendorsData);
      setItems(itemsData);
      
      // TODO: Load comparisons, history, attachments, and settings from database
      // For now, initialize with empty arrays
    } catch (error) {
      console.error('Failed to load data from database:', error);
    }
  };

  const handleVendorSelectionChange = useCallback((nextVendorIds: string[]) => {
    setRows((prevRows) => remapRowsForVendors(prevRows, selectedVendorIds, nextVendorIds));
    setSelectedVendorIds(nextVendorIds);
  }, [selectedVendorIds]);

  const handleAddVendor = useCallback((vendorId: string) => {
    if (!selectedVendorIds.includes(vendorId)) {
      handleVendorSelectionChange([...selectedVendorIds, vendorId]);
    }
  }, [selectedVendorIds, handleVendorSelectionChange]);

  const handleRemoveVendor = useCallback((vendorId: string) => {
    handleVendorSelectionChange(selectedVendorIds.filter((id) => id !== vendorId));
  }, [selectedVendorIds, handleVendorSelectionChange]);

  useEffect(() => {
    if (!vendors.length) {
      if (selectedVendorIds.length) {
        handleVendorSelectionChange([]);
      }
      return;
    }

    if (!selectedVendorIds.length) {
      handleVendorSelectionChange(vendors.slice(0, Math.min(3, vendors.length)).map((vendor) => vendor.id));
      return;
    }

    const filteredSelection = selectedVendorIds.filter((vendorId) => vendors.some((vendor) => vendor.id === vendorId));
    if (filteredSelection.length !== selectedVendorIds.length) {
      handleVendorSelectionChange(filteredSelection);
    }
  }, [vendors, selectedVendorIds, handleVendorSelectionChange]);

  // Initialize auth service and load data on first mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already logged in via cookie
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          // Load data after successful authentication
          await loadDataFromDatabase();
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    
    // Load data from database after login
    await loadDataFromDatabase();
    
    // Auto-populate settings with current user info
    setSettings(prev => ({
      ...prev,
      makerName: user.role === 'maker' ? user.name : prev.makerName,
      checkerName: user.role === 'checker' ? user.name : prev.checkerName,
      reqNo: prev.reqNo || 'REQ-' + new Date().getFullYear() + '-001',
      date: prev.date || new Date().toISOString().split('T')[0]
    }));
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginForm onLogin={handleLogin} />
    );
  }

  const permissions = getPermissions(currentUser);
  const selectedVendors = vendors.filter((vendor) => selectedVendorIds.includes(vendor.id));

  const tabItems = [
    { id: 'comparison', label: 'Comparison', icon: BarChart3, show: true },
    { id: 'history', label: 'History', icon: History, show: permissions.canViewHistory },
    { id: 'items', label: 'Items', icon: Package, show: permissions.canManageItems },
    { id: 'vendors', label: 'Vendors', icon: Building, show: permissions.canManageVendors },
    { id: 'attachments', label: 'Attachments', icon: Paperclip, show: permissions.canManageAttachments },
    { id: 'print', label: 'Print', icon: Printer, show: permissions.canPrint },
    { id: 'signature', label: 'Signature', icon: PenTool, show: true },
    { id: 'users', label: 'Users', icon: Users, show: permissions.canViewUsers },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, show: permissions.canEditSettings }
  ].filter(tab => tab.show);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Procurement Comparison System
              </h1>
              <p className="text-sm text-muted-foreground">Welcome, {currentUser.name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Badge 
                variant={currentUser.role === 'admin' ? 'destructive' : currentUser.role === 'checker' ? 'default' : 'secondary'}
                className="px-3 py-1"
              >
                {currentUser.role}
              </Badge>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-muted/50 backdrop-blur-sm p-1.5 text-muted-foreground w-full overflow-x-auto shadow-sm">
            {tabItems.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <ComparisonTable
              rows={rows}
              items={items}
              vendors={selectedVendors}
              allVendors={vendors}
              onRowsChange={setRows}
              onAddVendor={handleAddVendor}
              onRemoveVendor={handleRemoveVendor}
              generalComments={generalComments}
              onGeneralCommentsChange={setGeneralComments}
            />
          </TabsContent>

          {permissions.canViewHistory && (
            <TabsContent value="history" className="space-y-6">
              <ComparisonHistory
                currentUser={currentUser}
              />
            </TabsContent>
          )}

          {permissions.canManageItems && (
            <TabsContent value="items" className="space-y-6">
              <ItemManagement
                items={items}
                onItemsChange={setItems}
              />
            </TabsContent>
          )}

          {permissions.canManageVendors && (
            <TabsContent value="vendors" className="space-y-6">
              <VendorManagement
                vendors={vendors}
                onVendorsChange={setVendors}
              />
            </TabsContent>
          )}

          {permissions.canManageAttachments && (
            <TabsContent value="attachments" className="space-y-6">
              <AttachmentManager
                currentUser={currentUser}
              />
            </TabsContent>
          )}

          {permissions.canPrint && (
            <TabsContent value="print" className="space-y-6">
              <PrintView
                rows={rows}
                vendors={selectedVendors}
                settings={settings}
                currentUser={currentUser}
                generalComments={generalComments}
              />
            </TabsContent>
          )}

          <TabsContent value="signature" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Signature upload functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {permissions.canViewUsers && (
            <TabsContent value="users" className="space-y-6">
              <UserManagement
                currentUser={currentUser}
              />
            </TabsContent>
          )}

          {permissions.canEditSettings && (
            <TabsContent value="settings" className="space-y-6">
              <Settings
                settings={settings}
                onSettingsChange={setSettings}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}