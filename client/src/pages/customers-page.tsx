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
import { Plus, Loader2, Search, MapPin, Users } from "lucide-react";
import { Customer, InsertCustomer } from "@shared/schema";

const customerSchema = z.object({
  firstName: z.string().min(2, "Fornavn må ha minst 2 tegn"),
  lastName: z.string().min(2, "Etternavn må ha minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  phone: z.string().min(8, "Telefonnummer må ha minst 8 siffer"),
  address: z.string().min(5, "Adresse er påkrevd"),
  postalCode: z.string().regex(/^\d{4}$/, "Postnummer må være 4 siffer"),
  city: z.string().min(2, "Poststed er påkrevd"),
  municipality: z.string().optional(),
  saleAmount: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface AddressSuggestion {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenavn: string;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      city: "",
      municipality: "",
      saleAmount: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        municipality: data.municipality || undefined,
        saleAmount: data.saleAmount || undefined,
        notes: data.notes || undefined,
      };
      const res = await apiRequest("POST", "/api/customers", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Kunde registrert",
        description: "Kunden er lagt til og venter på godkjenning",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunne ikke registrere kunde",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const res = await fetch(`/api/address-search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setAddressSuggestions(data.adresser || []);
    } catch (error) {
      console.error("Address search error:", error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const selectAddress = (suggestion: AddressSuggestion) => {
    form.setValue("address", suggestion.adressetekst);
    form.setValue("postalCode", suggestion.postnummer);
    form.setValue("city", suggestion.poststed);
    form.setValue("municipality", suggestion.kommunenavn);
    setAddressSuggestions([]);
    setAddressQuery(suggestion.adressetekst);
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

  const onSubmit = (data: CustomerFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-customers-title">Kunder</h1>
          <p className="text-muted-foreground mt-1">
            Administrer dine kunder og se status på prosjekter
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-customer">
              <Plus className="mr-2 h-4 w-4" />
              Ny kunde
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrer ny kunde</DialogTitle>
              <DialogDescription>
                Fyll inn kundens informasjon. Bruk adressesøk for å finne riktig adresse.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornavn</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ola" 
                            data-testid="input-customer-firstname"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etternavn</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nordmann" 
                            data-testid="input-customer-lastname"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-post</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="ola@eksempel.no" 
                            data-testid="input-customer-email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12345678" 
                            data-testid="input-customer-phone"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>Søk adresse (Kartverket)</FormLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søk etter adresse..."
                      className="pl-10"
                      value={addressQuery}
                      onChange={(e) => {
                        setAddressQuery(e.target.value);
                        searchAddress(e.target.value);
                      }}
                      data-testid="input-address-search"
                    />
                    {isSearchingAddress && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                    )}
                  </div>
                  {addressSuggestions.length > 0 && (
                    <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
                      <CardContent className="p-0">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-muted flex items-start gap-3 border-b last:border-0"
                            onClick={() => selectAddress(suggestion)}
                            data-testid={`address-suggestion-${index}`}
                          >
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium">{suggestion.adressetekst}</p>
                              <p className="text-sm text-muted-foreground">
                                {suggestion.postnummer} {suggestion.poststed}, {suggestion.kommunenavn}
                              </p>
                            </div>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Gateadresse" 
                          data-testid="input-customer-address"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postnummer</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0000" 
                            data-testid="input-customer-postalcode"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poststed</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Oslo" 
                            data-testid="input-customer-city"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="municipality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kommune</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Oslo" 
                            data-testid="input-customer-municipality"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="saleAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salgsbeløp (kr)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10000" 
                          data-testid="input-customer-saleamount"
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
                      <FormLabel>Notater</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Eventuelle notater om kunden..." 
                          data-testid="input-customer-notes"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
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
                    data-testid="button-submit-customer"
                  >
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Registrer kunde
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kundeoversikt</CardTitle>
          <CardDescription>
            Alle dine registrerte kunder og deres status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : customers?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">Ingen kunder ennå</h3>
              <p className="mb-4">Kom i gang ved å registrere din første kunde</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Registrer kunde
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Salgsbeløp</TableHead>
                    <TableHead>Provisjon</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer) => (
                    <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.email}</p>
                          <p className="text-muted-foreground">{customer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.address}</p>
                          <p className="text-muted-foreground">
                            {customer.postalCode} {customer.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.saleAmount 
                          ? `${Number(customer.saleAmount).toLocaleString("nb-NO")} kr`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {customer.commissionAmount 
                          ? `${Number(customer.commissionAmount).toLocaleString("nb-NO")} kr`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(customer.status)}
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
