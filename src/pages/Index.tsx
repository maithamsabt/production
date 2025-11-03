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

import { User, Vendor, Item, ComparisonRow, ComparisonHistory as ComparisonHistoryType, AttachmentFile, AppSettings } from '@/lib/types';

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('comparison');

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

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'john.maker',
      password: 'maker123',
      role: 'maker',
      name: 'John Maker',
      isActive: true,
      createdAt: '2024-01-01'
    },
    {
      id: '2', 
      username: 'jane.checker',
      password: 'checker123',
      role: 'checker',
      name: 'Jane Checker',
      isActive: true,
      createdAt: '2024-01-01'
    }
  ]);

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

  // Load data from localStorage on mount
  useEffect(() => {
    const savedVendors = localStorage.getItem('vendors');
    const savedItems = localStorage.getItem('items');
    const savedRows = localStorage.getItem('rows');
    const savedHistory = localStorage.getItem('history');
    const savedAttachments = localStorage.getItem('attachments');
    const savedUsers = localStorage.getItem('users');
    const savedSettings = localStorage.getItem('settings');
    const savedGeneralComments = localStorage.getItem('generalComments');

    if (savedVendors) setVendors(JSON.parse(savedVendors));
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedRows) setRows(JSON.parse(savedRows));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedAttachments) setAttachments(JSON.parse(savedAttachments));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedGeneralComments) setGeneralComments(savedGeneralComments);

    // Auto-populate settings with current user info if available
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
      const user = JSON.parse(currentUserData);
      setCurrentUser(user);
      setSettings(prev => ({
        ...prev,
        makerName: user.role === 'maker' ? user.name : prev.makerName,
        checkerName: user.role === 'checker' ? user.name : prev.checkerName,
        reqNo: prev.reqNo || 'REQ-' + new Date().getFullYear() + '-001',
        date: prev.date || new Date().toISOString().split('T')[0]
      }));
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('rows', JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem('history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('attachments', JSON.stringify(attachments));
  }, [attachments]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('generalComments', generalComments);
  }, [generalComments]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  if (!currentUser) {
    return (
      <LoginForm onLogin={handleLogin} />
    );
  }

  const tabItems = [
    { id: 'comparison', label: 'Comparison', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'vendors', label: 'Vendors', icon: Building },
    { id: 'attachments', label: 'Attachments', icon: Paperclip },
    { id: 'print', label: 'Print', icon: Printer },
    { id: 'signature', label: 'Signature', icon: PenTool },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

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
              <Badge variant={currentUser.role === 'checker' ? 'default' : 'secondary'}>
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
          <TabsList className="grid w-full grid-cols-9">
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

          <TabsContent value="history" className="space-y-6">
            <ComparisonHistory
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <ItemManagement
              items={items}
              onItemsChange={setItems}
            />
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <VendorManagement
              vendors={vendors}
              onVendorsChange={setVendors}
            />
          </TabsContent>

          <TabsContent value="attachments" className="space-y-6">
            <AttachmentManager
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="print" className="space-y-6">
            <PrintView
              rows={rows}
              vendors={vendors}
              settings={settings}
              currentUser={currentUser}
              generalComments={generalComments}
            />
          </TabsContent>

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

          <TabsContent value="users" className="space-y-6">
            <UserManagement
              users={users}
              onUsersChange={setUsers}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Settings
              settings={settings}
              onSettingsChange={setSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}