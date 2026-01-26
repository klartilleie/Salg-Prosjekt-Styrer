import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { Customer } from "@shared/schema";

interface CustomerWithUser extends Customer {
  user?: {
    fullName: string;
    username: string;
  };
}

export default function AdminApprovalsPage() {
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithUser | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: customers, isLoading } = useQuery<CustomerWithUser[]>({
    queryKey: ["/api/admin/customers"],
  });

  const pendingCustomers = customers?.filter(c => c.status === "pending") || [];
  const processedCustomers = customers?.filter(c => c.status !== "pending") || [];

  const approveMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest("POST", `/api/admin/customers/${customerId}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsApproveDialogOpen(false);
      setSelectedCustomer(null);
      toast({
        title: "Salg godkjent",
        description: "Salget er godkjent. 5 000 kr og 100 poeng er tildelt selger.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunne ikke godkjenne salg",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest("POST", `/api/admin/customers/${customerId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setIsRejectDialogOpen(false);
      setSelectedCustomer(null);
      toast({
        title: "Salg avvist",
        description: "Salget er avvist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunne ikke avvise salg",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openApproveDialog = (customer: CustomerWithUser) => {
    setSelectedCustomer(customer);
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (customer: CustomerWithUser) => {
    setSelectedCustomer(customer);
    setIsRejectDialogOpen(true);
  };

  const onApprove = () => {
    if (!selectedCustomer) return;
    approveMutation.mutate(selectedCustomer.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Godkjent</Badge>;
      case "rejected":
        return <Badge variant="destructive">Avvist</Badge>;
      default:
        return <Badge variant="secondary">Venter</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-admin-approvals-title">Godkjenninger</h1>
        <p className="text-muted-foreground mt-1">
          Godkjenn eller avvis salg fra selgere
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle>Venter på godkjenning</CardTitle>
          </div>
          <CardDescription>
            {pendingCustomers.length} salg venter på din godkjenning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : pendingCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
              <p>Ingen salg venter på godkjenning</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Selger</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Salgsbeløp</TableHead>
                    <TableHead>Registrert</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`pending-row-${customer.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.user?.fullName || "Ukjent"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.address}</p>
                          <p className="text-muted-foreground">
                            {customer.postalCode} {customer.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.saleAmount 
                          ? `${Number(customer.saleAmount).toLocaleString("nb-NO")} kr`
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString("nb-NO")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => openApproveDialog(customer)}
                            data-testid={`button-approve-${customer.id}`}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Godkjenn
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(customer)}
                            data-testid={`button-reject-${customer.id}`}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Avvis
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Behandlede salg</CardTitle>
          </div>
          <CardDescription>
            Historikk over godkjente og avviste salg
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : processedCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Ingen behandlede salg ennå</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Selger</TableHead>
                    <TableHead>Salgsbeløp</TableHead>
                    <TableHead>Provisjon</TableHead>
                    <TableHead>Poeng</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Behandlet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`processed-row-${customer.id}`}>
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>
                        {customer.user?.fullName || "Ukjent"}
                      </TableCell>
                      <TableCell>
                        {customer.saleAmount 
                          ? `${Number(customer.saleAmount).toLocaleString("nb-NO")} kr`
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {customer.commissionAmount 
                          ? `${Number(customer.commissionAmount).toLocaleString("nb-NO")} kr`
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="text-primary font-medium">
                        {customer.pointsAwarded || "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(customer.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.approvedAt 
                          ? new Date(customer.approvedAt).toLocaleDateString("nb-NO")
                          : "-"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Godkjenn salg</DialogTitle>
            <DialogDescription>
              Ved godkjenning tildeles selger 5 000 kr og 100 poeng
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="py-4">
              <div className="rounded-lg bg-muted p-4 mb-4">
                <p className="font-medium">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Selger: {selectedCustomer.user?.fullName || "Ukjent"}
                </p>
              </div>
              <div className="rounded-lg border p-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provisjon:</span>
                  <span className="font-medium text-green-600">5 000 kr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poeng:</span>
                  <span className="font-medium text-primary">100 poeng</span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsApproveDialogOpen(false)}
                >
                  Avbryt
                </Button>
                <Button 
                  onClick={onApprove}
                  disabled={approveMutation.isPending}
                  data-testid="button-confirm-approve"
                >
                  {approveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Godkjenn salg
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avvis salg</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil avvise dette salget?
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="py-4">
              <div className="rounded-lg bg-muted p-4 mb-4">
                <p className="font-medium">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Selger: {selectedCustomer.user?.fullName || "Ukjent"}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsRejectDialogOpen(false)}
                >
                  Avbryt
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => rejectMutation.mutate(selectedCustomer.id)}
                  disabled={rejectMutation.isPending}
                  data-testid="button-confirm-reject"
                >
                  {rejectMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Avvis salg
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
