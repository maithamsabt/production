import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';
import { AppSettings } from '@/lib/types';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export default function Settings({ settings, onSettingsChange }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof AppSettings, value: string | number) => {
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={localSettings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="companyPhone">Phone Number</Label>
                <Input
                  id="companyPhone"
                  value={localSettings.companyPhone}
                  onChange={(e) => handleChange('companyPhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  value={localSettings.companyAddress}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  placeholder="Enter company address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Email Address</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={localSettings.companyEmail}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="defaultVat">Default VAT Rate (%)</Label>
                <Input
                  id="defaultVat"
                  type="number"
                  step="0.01"
                  value={localSettings.defaultVat}
                  onChange={(e) => handleChange('defaultVat', parseFloat(e.target.value) || 0)}
                  placeholder="Enter VAT rate"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Document Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Document Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reqNo">Request Number</Label>
                <Input
                  id="reqNo"
                  value={localSettings.reqNo}
                  onChange={(e) => handleChange('reqNo', e.target.value)}
                  placeholder="Enter request number"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={localSettings.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="makerName">Maker Name</Label>
                <Input
                  id="makerName"
                  value={localSettings.makerName}
                  onChange={(e) => handleChange('makerName', e.target.value)}
                  placeholder="Enter maker name"
                />
              </div>
              <div>
                <Label htmlFor="checkerName">Checker Name</Label>
                <Input
                  id="checkerName"
                  value={localSettings.checkerName}
                  onChange={(e) => handleChange('checkerName', e.target.value)}
                  placeholder="Enter checker name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={localSettings.purpose}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                  placeholder="Enter purpose of comparison"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="requestNumber">Request Number (Alternative)</Label>
                <Input
                  id="requestNumber"
                  value={localSettings.requestNumber}
                  onChange={(e) => handleChange('requestNumber', e.target.value)}
                  placeholder="Enter alternative request number"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}