import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Clock, FileCheck, AlertCircle } from 'lucide-react';
import { User } from '@/lib/types';
import { comparisonsAPI } from '@/lib/api/comparisons';
import { toast } from 'sonner';

interface CheckerReviewProps {
  currentUser: User;
}

export default function CheckerReview({ currentUser: _currentUser }: CheckerReviewProps) {
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComparison, setSelectedComparison] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      const data = await comparisonsAPI.getAll();
      setComparisons(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load comparisons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this comparison?')) return;

    setIsProcessing(true);
    try {
      await comparisonsAPI.approve(id);
      toast.success('Comparison approved successfully');
      await loadComparisons();
      setSelectedComparison(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve comparison');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await comparisonsAPI.reject(selectedComparison.id, rejectionReason);
      toast.success('Comparison rejected');
      await loadComparisons();
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedComparison(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject comparison');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      draft: { variant: 'secondary', icon: Clock, label: 'Draft' },
      submitted: { variant: 'default', icon: FileCheck, label: 'Pending Review' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const submittedComparisons = comparisons.filter(c => c.status === 'submitted');
  const processedComparisons = comparisons.filter(c => c.status === 'approved' || c.status === 'rejected');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading comparisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <Card className="shadow-lg border-2">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Pending Reviews ({submittedComparisons.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {submittedComparisons.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No pending reviews</AlertTitle>
              <AlertDescription>
                There are no comparisons waiting for your review at this time.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submittedComparisons.map((comparison) => (
                    <TableRow key={comparison.id}>
                      <TableCell className="font-medium">{comparison.requestNumber || 'N/A'}</TableCell>
                      <TableCell>{comparison.title || 'Untitled'}</TableCell>
                      <TableCell>{comparison.creator?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {comparison.submittedAt 
                          ? new Date(comparison.submittedAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(comparison.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedComparison(comparison)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(comparison.id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedComparison(comparison);
                              setShowRejectDialog(true);
                            }}
                            disabled={isProcessing}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Comparisons */}
      <Card className="shadow-lg border-2">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Processed Comparisons ({processedComparisons.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {processedComparisons.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No processed comparisons</AlertTitle>
              <AlertDescription>
                Comparisons you've reviewed will appear here.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Reviewed At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rejection Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedComparisons.map((comparison) => (
                    <TableRow key={comparison.id}>
                      <TableCell className="font-medium">{comparison.requestNumber || 'N/A'}</TableCell>
                      <TableCell>{comparison.title || 'Untitled'}</TableCell>
                      <TableCell>{comparison.creator?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {comparison.reviewedAt 
                          ? new Date(comparison.reviewedAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(comparison.status)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {comparison.rejectionReason || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Comparison</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this comparison. This will be sent back to the maker.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Comparison'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
