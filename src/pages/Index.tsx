import { useState, useEffect } from 'react';
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

import { Vendor, Item, ComparisonRow, ComparisonHistory as ComparisonHistoryType, AttachmentFile, AppSettings } from '@/lib/types';
import { authService, AuthUser } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';

export default function Index() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState('comparison');
  const [initialized, setInitialized] = useState(false);

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([
    { id: '1', name: 'Vendor A', contactPerson: 'John Doe', email: 'john@vendora.com', phone: '123-456-7890', address: '123 Main St', vat: 10, isActive: true, createdAt: '2024-01-01' },
    { id: '2', name: 'Vendor B', contactPerson: 'Jane Smith', email: 'jane@vendorb.com', phone: '098-765-4321', address: '456 Oak Ave', vat: 12, isActive: true, createdAt: '2024-01-01' },
    { id: '3', name: 'Vendor C', contactPerson: 'Bob Johnson', email: 'bob@vendorc.com', phone: '555-123-4567', address: '789 Pine Rd', vat: 15, isActive: true, createdAt: '2024-01-01' }
  ]);

  const [items, setItems] = useState<Item[]>([]);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [history, setHistory] = useState<ComparisonHistoryType[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
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

  // Initialize auth service and admin user on first mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize admin user with credentials from environment variables
        const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
        
        await authService.initializeAdminUser(adminUsername, adminPassword);
        
        // Try to restore session
        await authService.initialize();
        
        const user = authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    if (!initialized) return;

    const savedVendors = localStorage.getItem('vendors');
    const savedItems = localStorage.getItem('items');
    const savedRows = localStorage.getItem('rows');
    const savedHistory = localStorage.getItem('history');
    const savedAttachments = localStorage.getItem('attachments');
    const savedSettings = localStorage.getItem('settings');
    const savedGeneralComments = localStorage.getItem('generalComments');

    if (savedVendors) setVendors(JSON.parse(savedVendors));
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedRows) setRows(JSON.parse(savedRows));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedAttachments) setAttachments(JSON.parse(savedAttachments));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedGeneralComments) setGeneralComments(savedGeneralComments);
  }, [initialized]);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('vendors', JSON.stringify(vendors));
  }, [vendors, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('items', JSON.stringify(items));
  }, [items, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('rows', JSON.stringify(rows));
  }, [rows, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('history', JSON.stringify(history));
  }, [history, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('attachments', JSON.stringify(attachments));
  }, [attachments, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('generalComments', generalComments);
  }, [generalComments, initialized]);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    
    // Auto-populate settings with current user info
    setSettings(prev => ({
      ...prev,
      makerName: user.role === 'maker' ? user.name : prev.makerName,
      checkerName: user.role === 'checker' ? user.name : prev.checkerName,
      reqNo: prev.reqNo || 'REQ-' + new Date().getFullYear() + '-001',
      date: prev.date || new Date().toISOString().split('T')[0]
    }));
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleUserUpdate = () => {
    // Refresh current user data in case they updated their own profile
    const updatedUser = authService.getCurrentUser();
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Procurement Comparison System</h1>
              <p className="text-sm text-gray-600">Welcome, {currentUser.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={currentUser.role === 'admin' ? 'destructive' : currentUser.role === 'checker' ? 'default' : 'secondary'}>
                {currentUser.role}
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-${tabItems.length}`}>
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <ComparisonTable
              rows={rows}
              items={items}
              vendors={vendors}
              onRowsChange={setRows}
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
                vendors={vendors}
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
                onUserUpdate={handleUserUpdate}
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