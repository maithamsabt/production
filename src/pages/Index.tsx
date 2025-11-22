import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Package,
  Building,
  Paperclip,
  Printer,
  Users,
  Settings as SettingsIcon,
  LogOut,
  ClipboardCheck,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

import LoginForm from '@/components/LoginForm';
import ComparisonTable from '@/components/ComparisonTable';
import ItemManagement from '@/components/ItemManagement';
import VendorManagement from '@/components/VendorManagement';
import AttachmentManager from '@/components/AttachmentManager';
import PrintView from '@/components/PrintView';
import UserManagement from '@/components/UserManagement';
import Settings from '@/components/Settings';
import CheckerReview from '@/components/CheckerReview';
import { ThemeToggle } from '@/components/theme-toggle';

import { Vendor, Item, ComparisonRow, AppSettings } from '@/lib/types';
import { authService } from '@/lib/auth';
import { vendorsAPI, itemsAPI, comparisonsAPI, settingsAPI } from '@/lib/api';
import type { User } from '@/lib/types';
import { getPermissions } from '@/lib/permissions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  
  // Active comparison state
  const [activeComparisonId, setActiveComparisonId] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<any[]>([]);

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
      const [vendorsData, itemsData, comparisonsData, settingsData] = await Promise.all([
        vendorsAPI.getAll(),
        itemsAPI.getAll(),
        comparisonsAPI.getAll(),
        settingsAPI.get(),
      ]);
      
      setVendors(vendorsData);
      setItems(itemsData);
      setComparisons(comparisonsData);
      
      // Update settings from database
      setSettings({
        companyName: settingsData.companyName,
        companyAddress: settingsData.companyAddress,
        companyPhone: settingsData.companyPhone,
        companyEmail: settingsData.companyEmail,
        defaultVat: parseFloat(settingsData.defaultVat),
        reqNo: '',
        date: '',
        makerName: '',
        checkerName: '',
        checkerSignature: settingsData.checkerSignature || '',
        purpose: 'Procurement Comparison',
        requestNumber: ''
      });
    } catch (error) {
      console.error('Failed to load data from database:', error);
    }
  };

  const loadComparison = async (id: string) => {
    try {
      const comparison = await comparisonsAPI.getById(id);
      setActiveComparisonId(id);
      
      // Load comparison data into the form
      const comparisonVendorIds = comparison.vendors?.map((v: any) => v.id) || [];
      setSelectedVendorIds(comparisonVendorIds);
      
      // Map comparison rows to form rows
      const formRows = comparison.rows?.map((row: any) => ({
        id: row.id,
        srl: row.srl,
        itemId: row.itemId,
        item: row.item,
        description: row.description,
        qty: row.qty,
        uom: row.uom,
        quantities: row.quantities || [],
        prices: row.prices || [],
        vendor1UnitPrice: 0,
        vendor1Vat: 0,
        vendor1Total: 0,
        vendor2UnitPrice: 0,
        vendor2Vat: 0,
        vendor2Total: 0,
        vendor3UnitPrice: 0,
        vendor3Vat: 0,
        vendor3Total: 0,
        selectedVendorIndex: row.selectedVendorIndex,
        remarks: row.remarks || '',
        comment: row.comment || '',
      })) || [];
      
      setRows(formRows);
      setGeneralComments(comparison.generalComments || '');
      
      setSettings(prev => ({
        ...prev,
        reqNo: comparison.requestNumber,
        purpose: comparison.title,
      }));
    } catch (error) {
      console.error('Failed to load comparison:', error);
    }
  };

  const createNewComparison = () => {
    setActiveComparisonId(null);
    setRows([]);
    setGeneralComments('');
    
    // Auto-select first 3 vendors as default
    const defaultVendorIds = vendors.slice(0, Math.min(3, vendors.length)).map(v => v.id);
    setSelectedVendorIds(defaultVendorIds);
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

  const handleDeleteComparison = async () => {
    if (!activeComparisonId) return;
    
    const activeComparison = comparisons.find(c => c.id === activeComparisonId);
    if (!activeComparison || activeComparison.status !== 'draft') {
      toast.error('Only draft comparisons can be deleted');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${activeComparison.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await comparisonsAPI.delete(activeComparisonId);
      toast.success('Comparison deleted successfully');
      setActiveComparisonId(null);
      createNewComparison();
      await loadDataFromDatabase();
    } catch (error: any) {
      console.error('Failed to delete comparison:', error);
      toast.error(error.message || 'Failed to delete comparison');
    }
  };

  const permissions = getPermissions(currentUser);
  const selectedVendors = vendors.filter((vendor) => selectedVendorIds.includes(vendor.id));

  const tabItems = [
    { id: 'comparison', label: 'Comparison', icon: BarChart3, show: true },
    { id: 'review', label: 'Review', icon: ClipboardCheck, show: currentUser.role === 'checker' || currentUser.role === 'admin' },
    { id: 'items', label: 'Items', icon: Package, show: permissions.canManageItems },
    { id: 'vendors', label: 'Vendors', icon: Building, show: permissions.canManageVendors },
    { id: 'attachments', label: 'Attachments', icon: Paperclip, show: permissions.canManageAttachments },
    { id: 'print', label: 'Print', icon: Printer, show: permissions.canPrint },
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
            <Card className="shadow-lg border-2 backdrop-blur-sm bg-card/95">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold">
                    {activeComparisonId ? (
                      comparisons.find(c => c.id === activeComparisonId)?.status === 'draft' 
                        ? 'Edit Comparison' 
                        : 'View Comparison (Read-Only)'
                    ) : 'New Comparison'}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      onClick={createNewComparison}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New (3 Vendors)
                    </Button>
                    {activeComparisonId && comparisons.find(c => c.id === activeComparisonId)?.status === 'draft' && (
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteComparison}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Draft
                      </Button>
                    )}
                    <select
                      className="px-3 py-2 border rounded-md min-w-[300px]"
                      value={activeComparisonId || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          loadComparison(e.target.value);
                        } else {
                          createNewComparison();
                        }
                      }}
                    >
                      <option value="">-- New Comparison --</option>
                      <optgroup label="Draft (Editable)">
                        {comparisons.filter(c => c.status === 'draft').map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.requestNumber} - {comp.title}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Submitted (View Only)">
                        {comparisons.filter(c => c.status === 'submitted').map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.requestNumber} - {comp.title}
                          </option>
                        ))}
                      </optgroup>
                      {(currentUser.role === 'checker' || currentUser.role === 'admin') && (
                        <optgroup label="Processed (View Only)">
                          {comparisons.filter(c => ['approved', 'rejected'].includes(c.status)).map((comp) => (
                            <option key={comp.id} value={comp.id}>
                              {comp.requestNumber} - {comp.title} ({comp.status})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
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
              requestNumber={settings.reqNo}
              title={settings.purpose}
              currentComparisonId={activeComparisonId}
              comparisonStatus={comparisons.find(c => c.id === activeComparisonId)?.status}
              onComparisonSaved={(id) => {
                setActiveComparisonId(id);
                loadDataFromDatabase();
              }}
            />
          </TabsContent>

          {(currentUser.role === 'checker' || currentUser.role === 'admin') && (
            <TabsContent value="review" className="space-y-6">
              <CheckerReview
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
              {activeComparisonId ? (
                <PrintView
                  rows={rows}
                  vendors={selectedVendors}
                  settings={settings}
                  currentUser={currentUser}
                  generalComments={generalComments}
                  activeComparison={comparisons.find(c => c.id === activeComparisonId)}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Comparison Selected</AlertTitle>
                      <AlertDescription>
                        Please select or create a comparison to view the print preview.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

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
                onSettingsSaved={loadDataFromDatabase}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}