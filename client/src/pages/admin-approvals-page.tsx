import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle, Clock, Eye, FileText, ImagePlus, Loader2, Printer, XCircle } from "lucide-react";
import { Attachment, Customer } from "@shared/schema";
import {
  BIOCLEANER_MODELS,
  BIOCLEANER_TYPES,
  DEFAULT_PRICES,
  GRAVING_OPTIONS,
  STYRESKAP_OPTIONS,
  formatKr,
  parseStoredQuote,
  previewQuote,
  quoteFormSchema,
  type QuoteFormData,
  type StoredQuote,
} from "@shared/biocleaner-offer";

interface CustomerWithMeta extends Customer {
  user?: { fullName: string; username: string };
  photoCount?: number;
  attachments?: Attachment[];
  quote?: StoredQuote | null;
}

function emptyForm(): QuoteFormData {
  return {
    customerName: "",
    customerAddress: "",
    streetName: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    municipality: "",
    customerEmail: "",
    customerPhone: "",
    biocleanerModel: "bc6",
    biocleanerType: "optima",
    numberOfHomes: "1",
    styreskapSize: "small",
    utehus: "nei",
    gravingPrice: DEFAULT_PRICES.graving,
    pumpekumme: "nei",
    airPumpe: "none",
    pumpeKjemi: "nei",
    pumpeTilKumme: "nei",
    tilleggsring: "none",
    tilleggsringAntall: 1,
    etterpolleringskum: "none",
    etterpolleringPlus: "none",
    uvLampe: "none",
    serviceKjoring: "none",
    serviceBesok: 2,
    aluminiumFatLiter: 0,
    offerComments: "",
  };
}

function formFromCustomer(customer: CustomerWithMeta): QuoteFormData {
  const quote = parseStoredQuote(customer.quotePayload);
  if (quote?.formInput) return { ...emptyForm(), ...quote.formInput };
  if (!quote) {
    return {
      ...emptyForm(),
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerAddress: customer.address,
      postalCode: customer.postalCode,
      city: customer.city,
      municipality: customer.municipality || "",
      customerEmail: customer.email,
      customerPhone: customer.phone,
    };
  }
  return {
    ...emptyForm(),
    customerName: quote.customer.name,
    customerAddress: quote.customer.address,
    streetName: quote.customer.streetName,
    houseNumber: quote.customer.houseNumber,
    postalCode: quote.customer.postalCode,
    city: quote.customer.city,
    municipality: quote.customer.municipality,
    customerEmail: quote.customer.email,
    customerPhone: quote.customer.phone,
    numberOfHomes: quote.customer.numberOfHomes,
    biocleanerModel: quote.modelId,
    biocleanerType: (quote.typeId as QuoteFormData["biocleanerType"]) || "comfort",
    offerComments: quote.comments,
  };
}

export default function AdminApprovalsPage() {
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithMeta | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [editForm, setEditForm] = useState<QuoteFormData>(emptyForm());
  const [reviewAttachments, setReviewAttachments] = useState<Attachment[]>([]);

  const { data: customers, isLoading } = useQuery<CustomerWithMeta[]>({
    queryKey: ["/api/admin/customers"],
  });

  const pendingCustomers = customers?.filter((c) => c.status === "pending") || [];
  const processedCustomers = customers?.filter((c) => c.status !== "pending") || [];
  const preview = useMemo(() => previewQuote(editForm), [editForm]);

  useEffect(() => {
    if (!selectedCustomer || !isReviewOpen) return;
    setEditForm(formFromCustomer(selectedCustomer));
    setReviewAttachments(selectedCustomer.attachments || []);
  }, [selectedCustomer, isReviewOpen]);

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
        description: "Salget er godkjent internt. 5 000 kr og 100 poeng er tildelt selger.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Kunne ikke godkjenne salg", description: error.message, variant: "destructive" });
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
      toast({ title: "Salg avvist", description: "Salget er avvist" });
    },
    onError: (error: Error) => {
      toast({ title: "Kunne ikke avvise salg", description: error.message, variant: "destructive" });
    },
  });

  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) throw new Error("Ingen kunde valgt");
      const validated = quoteFormSchema.parse(editForm);
      const res = await apiRequest("PATCH", `/api/admin/customers/${selectedCustomer.id}/quote`, validated);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setSelectedCustomer((current) => current ? { ...current, ...data, quotePayload: JSON.stringify(data.quote) } : current);
      setReviewAttachments(data.attachments || []);
      toast({ title: "Skjema lagret", description: "Endringene er lagret i databasen. Ikke sendt til kunden." });
    },
    onError: (error: Error) => {
      toast({ title: "Kunne ikke lagre", description: error.message, variant: "destructive" });
    },
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!selectedCustomer) throw new Error("Ingen kunde valgt");
      const body = new FormData();
      Array.from(files).forEach((file) => body.append("photos", file, file.name));
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/attachments`, {
        method: "POST",
        credentials: "include",
        body,
      });
      if (!res.ok) throw new Error(await res.text() || "Kunne ikke laste opp bilder");
      return res.json();
    },
    onSuccess: (created: Attachment[]) => {
      setReviewAttachments((current) => [...created, ...current]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "Bilder lagret", description: `${created.length} bilde(r) er lagt til.` });
    },
    onError: (error: Error) => {
      toast({ title: "Opplasting feilet", description: error.message, variant: "destructive" });
    },
  });

  const openReview = (customer: CustomerWithMeta) => {
    setSelectedCustomer(customer);
    setIsReviewOpen(true);
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
        <h1 className="text-3xl font-bold" data-testid="text-admin-approvals-title">Innsendte skjema</h1>
        <p className="mt-1 text-muted-foreground">
          Se, rediger og last ned innsendte skjema som PDF. Bildene brukes til å kontrollere utfyllingen.
          Skjemaene sendes ikke til kunden.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle>Venter på behandling</CardTitle>
          </div>
          <CardDescription>{pendingCustomers.length} skjema venter</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : pendingCustomers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500 opacity-50" />
              <p>Ingen skjema venter</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Innsendt av</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Beløp</TableHead>
                    <TableHead>Bilder</TableHead>
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
                      <TableCell>{customer.user?.fullName || "Ukjent"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.address}</p>
                          <p className="text-muted-foreground">{customer.postalCode} {customer.city}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.saleAmount ? `${Number(customer.saleAmount).toLocaleString("nb-NO")} kr` : "-"}
                      </TableCell>
                      <TableCell>{customer.photoCount || 0}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString("nb-NO")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openReview(customer)} data-testid={`button-review-${customer.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            Åpne
                          </Button>
                          {parseStoredQuote(customer.quotePayload) && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={`/api/customers/${customer.id}/quote-pdf`} target="_blank" rel="noreferrer">
                                <Printer className="mr-1 h-4 w-4" />
                                PDF
                              </a>
                            </Button>
                          )}
                          <Button size="sm" onClick={() => { setSelectedCustomer(customer); setIsApproveDialogOpen(true); }}>
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Godkjenn
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedCustomer(customer); setIsRejectDialogOpen(true); }}>
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
            <CardTitle>Behandlede skjema</CardTitle>
          </div>
          <CardDescription>Historikk over godkjente og avviste innsendelser</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : processedCustomers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>Ingen behandlede skjema ennå</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Innsendt av</TableHead>
                    <TableHead>Beløp</TableHead>
                    <TableHead>Bilder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Behandlet</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`processed-row-${customer.id}`}>
                      <TableCell className="font-medium">{customer.firstName} {customer.lastName}</TableCell>
                      <TableCell>{customer.user?.fullName || "Ukjent"}</TableCell>
                      <TableCell>
                        {customer.saleAmount ? `${Number(customer.saleAmount).toLocaleString("nb-NO")} kr` : "-"}
                      </TableCell>
                      <TableCell>{customer.photoCount || 0}</TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.approvedAt ? new Date(customer.approvedAt).toLocaleDateString("nb-NO") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openReview(customer)}>
                            <Eye className="mr-1 h-4 w-4" />
                            Åpne
                          </Button>
                          {parseStoredQuote(customer.quotePayload) && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={`/api/customers/${customer.id}/quote-pdf`} target="_blank" rel="noreferrer">PDF</a>
                            </Button>
                          )}
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

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Skjema for intern behandling</DialogTitle>
            <DialogDescription>
              Rediger utfylling, se bilder og last ned PDF. Endringer lagres i databasen og sendes ikke til kunden.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Kunde navn" value={editForm.customerName} onChange={(value) => setEditForm((f) => ({ ...f, customerName: value }))} />
                <Field label="Telefon" value={editForm.customerPhone} onChange={(value) => setEditForm((f) => ({ ...f, customerPhone: value }))} />
                <Field label="E-post" value={editForm.customerEmail} onChange={(value) => setEditForm((f) => ({ ...f, customerEmail: value }))} />
                <Field label="Adresse" value={editForm.customerAddress} onChange={(value) => setEditForm((f) => ({ ...f, customerAddress: value }))} />
                <Field label="Postnummer" value={editForm.postalCode} onChange={(value) => setEditForm((f) => ({ ...f, postalCode: value }))} />
                <Field label="Poststed" value={editForm.city} onChange={(value) => setEditForm((f) => ({ ...f, city: value }))} />
                <div>
                  <Label>Modell / tank</Label>
                  <Select value={editForm.biocleanerModel} onValueChange={(value) => setEditForm((f) => ({ ...f, biocleanerModel: value }))}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BIOCLEANER_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={editForm.biocleanerType} onValueChange={(value) => setEditForm((f) => ({ ...f, biocleanerType: value as QuoteFormData["biocleanerType"] }))}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BIOCLEANER_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Styreskap</Label>
                  <Select value={editForm.styreskapSize} onValueChange={(value) => setEditForm((f) => ({ ...f, styreskapSize: value as QuoteFormData["styreskapSize"] }))}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYRESKAP_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Graving</Label>
                  <Select value={String(editForm.gravingPrice)} onValueChange={(value) => setEditForm((f) => ({ ...f, gravingPrice: Number(value) }))}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GRAVING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Kommentarer</Label>
                <Textarea
                  className="mt-2"
                  value={editForm.offerComments || ""}
                  onChange={(event) => setEditForm((f) => ({ ...f, offerComments: event.target.value }))}
                />
              </div>

              {preview && (
                <div className="space-y-2 rounded-lg border p-4 text-sm">
                  <p className="font-medium">Prisoversikt (oppdateres automatisk)</p>
                  {preview.lines.map((line) => (
                    <div key={line.label} className="flex justify-between gap-3">
                      <span className="min-w-0">{line.label}</span>
                      <span className="shrink-0">{formatKr(line.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>FRA-total inkl. mva</span>
                    <span>{formatKr(preview.total)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-medium">
                    <Camera className="h-4 w-4" />
                    Bilder ({reviewAttachments.filter((item) => (item.mimeType || "").startsWith("image/")).length})
                  </p>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Legg til bilder
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files?.length) uploadPhotosMutation.mutate(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </Button>
                </div>
                {reviewAttachments.filter((item) => (item.mimeType || "").startsWith("image/")).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen bilder er lagret på dette skjemaet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {reviewAttachments.filter((item) => (item.mimeType || "").startsWith("image/")).map((photo) => (
                      <a key={photo.id} href={photo.fileUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border">
                        <img src={photo.fileUrl} alt={photo.fileName} className="h-36 w-full object-cover" />
                        <p className="truncate px-2 py-1 text-xs text-muted-foreground">{photo.fileName}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="outline" asChild>
                  <a href={`/api/customers/${selectedCustomer.id}/quote-pdf`} target="_blank" rel="noreferrer">
                    <Printer className="mr-2 h-4 w-4" />
                    Last ned PDF
                  </a>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Lukk</Button>
                  <Button onClick={() => saveQuoteMutation.mutate()} disabled={saveQuoteMutation.isPending} data-testid="button-save-quote">
                    {saveQuoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lagre endringer
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Godkjenn salg</DialogTitle>
            <DialogDescription>Ved godkjenning tildeles selger 5 000 kr og 100 poeng. Kunden får ikke e-post.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="py-4">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                <p className="text-sm text-muted-foreground">Selger: {selectedCustomer.user?.fullName || "Ukjent"}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Avbryt</Button>
                <Button onClick={() => approveMutation.mutate(selectedCustomer.id)} disabled={approveMutation.isPending} data-testid="button-confirm-approve">
                  {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            <DialogDescription>Er du sikker på at du vil avvise dette skjemaet?</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="py-4">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Avbryt</Button>
                <Button variant="destructive" onClick={() => rejectMutation.mutate(selectedCustomer.id)} disabled={rejectMutation.isPending} data-testid="button-confirm-reject">
                  {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Avvis
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
