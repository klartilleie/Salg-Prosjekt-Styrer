import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, CheckCircle, XCircle, Clock, Wallet, DollarSign, CreditCard } from "lucide-react";
import { Payout } from "@shared/schema";

interface PayoutWithUser extends Payout {
  user?: {
    fullName: string;
    username: string;
    bankAccountNumber?: string | null;
  };
}

export default function AdminPayoutsPage() {
  const { toast } = useToast();
  const [selectedPayout, setSelectedPayout] = useState<PayoutWithUser | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");

  const { data: payouts, isLoading } = useQuery<PayoutWithUser[]>({
    queryKey: ["/api/admin/payouts"],
  });

  const pendingPayouts = payouts?.filter(p => p.status === "pending") || [];
  const processedPayouts = payouts?.filter(p => p.status !== "pending") || [];

  const totalPending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaid = payouts?.filter(p => p.status === "completed").reduce(
    (sum, p) => sum + Number(p.amount), 0
  ) || 0;

  const completeMutation = useMutation({
    mutationFn: async ({ payoutId, paidAmount }: { payoutId: string; paidAmount: string }) => {
      const res = await apiRequest("POST", `/api/admin/payouts/${payoutId}/complete`, {
        paidAmount: paidAmount,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      setIsCompleteDialogOpen(false);
      setSelectedPayout(null);
      setPaidAmount("");
      toast({
        title: "Utbetaling fullført",
        description: "Utbetalingen er merket som fullført",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunne ikke fullføre utbetaling",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const res = await apiRequest("POST", `/api/admin/payouts/${payoutId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      setIsRejectDialogOpen(false);
      setSelectedPayout(null);
      toast({
        title: "Utbetaling avvist",
        description: "Utbetalingen er avvist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunne ikke avvise utbetaling",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Utbetalt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Avvist</Badge>;
      default:
        return <Badge variant="secondary">Venter</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-admin-payouts-title">Utbetalingshåndtering</h1>
        <p className="text-muted-foreground mt-1">
          Behandle utbetalingsforespørsler fra selgere
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venter på behandling</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-payouts">
              {pendingPayouts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Totalt: {totalPending.toLocaleString("nb-NO")} kr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt utbetalt</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-paid-admin">
              {totalPaid.toLocaleString("nb-NO")} kr
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Alle fullførte utbetalinger
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Behandlede</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-processed-count">
              {processedPayouts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Totalt behandlet
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle>Venter på behandling</CardTitle>
          </div>
          <CardDescription>
            {pendingPayouts.length} utbetalingsforespørsler venter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : pendingPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
              <p>Ingen utbetalinger venter på behandling</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Selger</TableHead>
                    <TableHead>Beløp</TableHead>
                    <TableHead>Notat</TableHead>
                    <TableHead>Forespurt</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.map((payout) => (
                    <TableRow key={payout.id} data-testid={`pending-payout-row-${payout.id}`}>
                      <TableCell className="font-medium">
                        {payout.user?.fullName || "Ukjent"}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {Number(payout.amount).toLocaleString("nb-NO")} kr
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {payout.notes || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString("nb-NO")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setIsCompleteDialogOpen(true);
                            }}
                            data-testid={`button-complete-payout-${payout.id}`}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Utbetal
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setIsRejectDialogOpen(true);
                            }}
                            data-testid={`button-reject-payout-${payout.id}`}
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
          <CardTitle>Behandlet</CardTitle>
          <CardDescription>
            Historikk over behandlede utbetalinger
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : processedPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Ingen behandlede utbetalinger ennå</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Selger</TableHead>
                    <TableHead>Forespurt</TableHead>
                    <TableHead>Utbetalt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Behandlet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedPayouts.map((payout) => (
                    <TableRow key={payout.id} data-testid={`processed-payout-row-${payout.id}`}>
                      <TableCell className="font-medium">
                        {payout.user?.fullName || "Ukjent"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {Number(payout.amount).toLocaleString("nb-NO")} kr
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {payout.paidAmount 
                          ? `${Number(payout.paidAmount).toLocaleString("nb-NO")} kr`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payout.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payout.processedAt 
                          ? new Date(payout.processedAt).toLocaleDateString("nb-NO")
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

      <Dialog open={isCompleteDialogOpen} onOpenChange={(open) => {
        setIsCompleteDialogOpen(open);
        if (!open) setPaidAmount("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bekreft utbetaling</DialogTitle>
            <DialogDescription>
              Oppgi utbetalt beløp og marker som fullført
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="py-4 space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedPayout.user?.fullName}</p>
                <p className="text-2xl font-bold text-primary mt-2">
                  Forespurt: {Number(selectedPayout.amount).toLocaleString("nb-NO")} kr
                </p>
                {selectedPayout.user?.bankAccountNumber && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Kontonr: {selectedPayout.user.bankAccountNumber}</span>
                  </div>
                )}
                {!selectedPayout.user?.bankAccountNumber && (
                  <p className="text-sm text-amber-600 mt-3">
                    Brukeren har ikke oppgitt kontonummer
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Utbetalt beløp (kr)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  placeholder={selectedPayout.amount?.toString() || "0"}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  data-testid="input-paid-amount"
                />
                <p className="text-xs text-muted-foreground">
                  Oppgi beløpet som faktisk ble utbetalt
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCompleteDialogOpen(false)}
                >
                  Avbryt
                </Button>
                <Button 
                  onClick={() => completeMutation.mutate({
                    payoutId: selectedPayout.id,
                    paidAmount: paidAmount || selectedPayout.amount?.toString() || "0",
                  })}
                  disabled={completeMutation.isPending}
                  data-testid="button-confirm-complete"
                >
                  {completeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Bekreft utbetaling
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avvis utbetaling</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil avvise denne utbetalingsforespørselen?
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="py-4">
              <div className="rounded-lg bg-muted p-4 mb-4">
                <p className="font-medium">{selectedPayout.user?.fullName}</p>
                <p className="text-lg">
                  Beløp: {Number(selectedPayout.amount).toLocaleString("nb-NO")} kr
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
                  onClick={() => rejectMutation.mutate(selectedPayout.id)}
                  disabled={rejectMutation.isPending}
                  data-testid="button-confirm-reject-payout"
                >
                  {rejectMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Avvis utbetaling
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
