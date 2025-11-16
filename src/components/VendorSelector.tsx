import { Vendor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';

interface VendorSelectorProps {
  vendors: Vendor[];
  selectedVendorIds: string[];
  onChange: (ids: string[]) => void;
}

export function VendorSelector({ vendors, selectedVendorIds, onChange }: VendorSelectorProps) {
  const toggleVendor = (vendorId: string) => {
    if (selectedVendorIds.includes(vendorId)) {
      onChange(selectedVendorIds.filter((id) => id !== vendorId));
      return;
    }

    onChange([...selectedVendorIds, vendorId]);
  };

  const handleSelectAll = () => {
    if (selectedVendorIds.length === vendors.length) {
      onChange([]);
      return;
    }

    onChange(vendors.map((vendor) => vendor.id));
  };

  const selectedVendors = vendors.filter((vendor) => selectedVendorIds.includes(vendor.id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-medium">Vendor Selection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose which vendors to include in this comparison.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              {selectedVendorIds.length ? `${selectedVendorIds.length} Selected` : 'Select Vendors'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Available Vendors</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={selectedVendorIds.length === vendors.length && vendors.length > 0}
              onCheckedChange={handleSelectAll}
            >
              {selectedVendorIds.length === vendors.length && vendors.length > 0
                ? 'Clear Selection'
                : 'Select All'}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {vendors.map((vendor) => (
              <DropdownMenuCheckboxItem
                key={vendor.id}
                checked={selectedVendorIds.includes(vendor.id)}
                onCheckedChange={() => toggleVendor(vendor.id)}
              >
                {vendor.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {selectedVendors.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedVendors.map((vendor) => (
              <Badge key={vendor.id} variant="secondary">
                {vendor.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No vendors selected yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
