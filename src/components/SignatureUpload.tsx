import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileImage } from 'lucide-react';
import { toast } from 'sonner';

interface SignatureUploadProps {
  currentSignature?: string;
  onSignatureChange: (signature: string | undefined) => void;
  disabled?: boolean;
}

export default function SignatureUpload({ 
  currentSignature, 
  onSignatureChange, 
  disabled = false 
}: SignatureUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file for signature');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Signature file must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onSignatureChange(result);
      toast.success('Electronic signature uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeSignature = () => {
    onSignatureChange(undefined);
    toast.success('Electronic signature removed');
  };

  if (disabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Electronic Signature
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSignature ? (
            <div className="space-y-2">
              <img 
                src={currentSignature} 
                alt="Electronic Signature" 
                className="max-w-full h-auto max-h-32 border rounded"
              />
              <p className="text-sm text-gray-600">Signature uploaded</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No signature uploaded</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Electronic Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentSignature ? (
          <div className="space-y-2">
            <img 
              src={currentSignature} 
              alt="Electronic Signature" 
              className="max-w-full h-auto max-h-32 border rounded"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={removeSignature}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Remove Signature
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop signature image here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports PNG, JPG, GIF (max 2MB)
              </p>
            </div>
            
            <div>
              <Label htmlFor="signature-upload">Upload Signature File</Label>
              <Input
                id="signature-upload"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}