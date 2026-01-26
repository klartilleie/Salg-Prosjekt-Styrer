import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Wallet, ArrowUpRight, Clock, CheckCircle } from "lucide-react";
import { Payout } from "@shared/schema";

const payoutRequestSchema = z.object({
  amount: z.string().min(1, "Beløp er påkrevd"),
  notes: z.string().optional(),
});

type PayoutRequestFormData = z.infer<typeof payoutRequestSchema>;

export default function PayoutsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: payouts, isLoading } = useQuery<Payout[]>({
    queryKey: ["/api/payouts"],
  });

  const form = useForm<PayoutRequestFormData>({
    resolver: zodResolver(payoutRequestSchema),
    defaultValues: {
      amount: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PayoutRequestFormData) => {
      const res = await apiRequest("POST", "/api/payouts", {
        amount: data.amount,
        notes: data.notes || undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payouts"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Utbetalingsforespørsel sendt",
        description: "Din forespørsel er registrert og venter på behandling",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunne ikke sende forespørsel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const availableBalance = Number(user?.earnings || 0);
  const pendingPayouts = payouts?.filter(p => p.status === "pending").reduce(
    (sum, p) => sum + Number(p.amount), 0
  ) || 0;
  const withdrawableBalance = availableBalance - pendingPayouts;

  const totalPaid = payouts?.filter(p => p.status === "completed").reduce(
    (sum, p) => sum + Number(p.amount), 0
  ) || 0;

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

  const onSubmit = (data: PayoutRequestFormData) => {
    const amount = parseFloat(data.amount);
    if (amount > withdrawableBalance) {
      toast({
        title: "Ugyldig beløp",
        description: "Du kan ikke be om mer enn tilgjengelig saldo",
        variant: "destructive",
      });
      return;
    }
    if (amount < 100) {
      toast({
        title: "Ugyldig beløp",
        description: "Minimum utbetaling er 100 kr",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-payouts-title">Utbetalinger</h1>
          <p className="text-muted-foreground mt-1">
            Oversikt over dine inntekter og utbetalinger
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={withdrawableBalance < 100}
              data-testid="button-request-payout"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Be om utbetaling
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Be om utbetaling</DialogTitle>
              <DialogDescription>
                Du kan be om utbetaling av opptil {withdrawableBalance.toLocaleString("nb-NO")} kr
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beløp (kr)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="100"
                          max={withdrawableBalance}
                          placeholder="1000" 
                          data-testid="input-payout-amount"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notat (valgfritt)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Eventuelle notater..." 
                          data-testid="input-payout-notes"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-payout"
                  >
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send forespørsel
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total inntekt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-earnings">
              {availableBalance.toLocaleString("nb-NO")} kr
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Totalt opptjent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tilgjengelig</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-available-balance">
              {withdrawableBalance.toLocaleString("nb-NO")} kr
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Kan tas ut nå
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utbetalt totalt</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-paid">
              {totalPaid.toLocaleString("nb-NO")} kr
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tidligere utbetalinger
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utbetalingshistorikk</CardTitle>
          <CardDescription>
            Alle dine utbetalingsforespørsler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : payouts?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">Ingen utbetalinger ennå</h3>
              <p className="mb-4">Du har ikke bedt om noen utbetalinger</p>
              {withdrawableBalance >= 100 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Be om utbetaling
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Beløp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notat</TableHead>
                    <TableHead>Behandlet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts?.map((payout) => (
                    <TableRow key={payout.id} data-testid={`payout-row-${payout.id}`}>
                      <TableCell>
                        {new Date(payout.createdAt).toLocaleDateString("nb-NO")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {Number(payout.amount).toLocaleString("nb-NO")} kr
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payout.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {payout.notes || "-"}
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
    </div>
  );
}
