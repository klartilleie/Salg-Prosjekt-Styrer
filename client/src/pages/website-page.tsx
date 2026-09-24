import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Award, Check, Home, Loader2, MapPin, Search, Wallet } from "lucide-react";

const quoteSchema = z.object({
  firstName: z.string().min(2, "Fornavn må ha minst 2 tegn"),
  lastName: z.string().min(2, "Etternavn må ha minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  phone: z.string().min(8, "Telefonnummer må ha minst 8 siffer"),
  address: z.string().min(5, "Adresse er påkrevd"),
  postalCode: z.string().regex(/^\d{4}$/, "Postnummer må være 4 siffer"),
  city: z.string().min(2, "Poststed er påkrevd"),
  municipality: z.string().optional(),
  saleAmount: z.string().optional(),
  notes: z.string().min(2, "Notat er påkrevd"),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface AddressSuggestion {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenavn: string;
}

export default function WebsitePage() {
  const [sent, setSent] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
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

  useEffect(() => {
    if (addressQuery.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await fetch(`/api/address-search?query=${encodeURIComponent(addressQuery)}`);
        const data = await res.json();
        setAddressSuggestions(data.adresser || []);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [addressQuery]);

  const submitQuote = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Kunne ikke sende skjemaet");
      }
      return res.json();
    },
    onSuccess: () => setSent(true),
  });

  const selectAddress = (suggestion: AddressSuggestion) => {
    form.setValue("address", suggestion.adressetekst, { shouldValidate: true });
    form.setValue("postalCode", suggestion.postnummer, { shouldValidate: true });
    form.setValue("city", suggestion.poststed, { shouldValidate: true });
    form.setValue("municipality", suggestion.kommunenavn);
    setAddressQuery("");
    setAddressSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </span>
            Tilbud
          </div>
          <Button asChild>
            <Link href="/logg-inn">Åpne appen</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Priser</CardTitle>
              <CardDescription>Samme satser som i appen når et salg godkjennes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="flex items-center gap-2 text-sm"><Wallet className="h-4 w-4 text-green-600" /> Provisjon</span>
                <span className="font-semibold text-green-600">5 000 kr</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-primary" /> Poeng</span>
                <span className="font-semibold text-primary">100 poeng</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Salgsbeløpet fylles inn i skjemaet. Minste utbetaling i appen er 100 kr.
              </p>
            </CardContent>
          </Card>
        </aside>

        <Card>
          <CardHeader>
            <CardTitle>Registrer tilbud</CardTitle>
            <CardDescription>
              Kontakt, adresse fra Kartverket, salgsbeløp og notat. Det samme skjemaet som i appen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold">Skjemaet er sendt</h2>
                <p className="text-muted-foreground">Tilbudet ligger klart til godkjenning. Provisjon er 5 000 kr og 100 poeng.</p>
                <Button variant="outline" onClick={() => { form.reset(); setSent(false); }}>
                  Registrer et nytt tilbud
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit((data) => submitQuote.mutate(data))}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornavn</FormLabel>
                        <FormControl><Input data-testid="quote-first-name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etternavn</FormLabel>
                        <FormControl><Input data-testid="quote-last-name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-post</FormLabel>
                        <FormControl><Input type="email" data-testid="quote-email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl><Input type="tel" data-testid="quote-phone" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="relative">
                    <FormLabel>Søk adresse (Kartverket)</FormLabel>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-10" placeholder="Søk etter adresse..." value={addressQuery} onChange={(event) => setAddressQuery(event.target.value)} data-testid="quote-address-search" />
                      {isSearchingAddress && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />}
                    </div>
                    {addressSuggestions.length > 0 && (
                      <Card className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto">
                        <CardContent className="p-0">
                          {addressSuggestions.map((suggestion, index) => (
                            <button key={`${suggestion.adressetekst}-${index}`} type="button" className="flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted" onClick={() => selectAddress(suggestion)}>
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                <span className="block font-medium">{suggestion.adressetekst}</span>
                                <span className="text-sm text-muted-foreground">{suggestion.postnummer} {suggestion.poststed}, {suggestion.kommunenavn}</span>
                              </span>
                            </button>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl><Input data-testid="quote-address" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="postalCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postnummer</FormLabel>
                        <FormControl><Input data-testid="quote-postal-code" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poststed</FormLabel>
                        <FormControl><Input data-testid="quote-city" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="municipality" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kommune</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="saleAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salgsbeløp (kr)</FormLabel>
                      <FormControl><Input type="number" placeholder="10000" data-testid="quote-sale-amount" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notater</FormLabel>
                      <FormControl><Textarea placeholder="Eventuelle notater om kunden..." data-testid="quote-notes" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {submitQuote.isError && <p className="text-sm text-destructive">{submitQuote.error.message}</p>}
                  <Button type="submit" disabled={submitQuote.isPending} data-testid="quote-submit">
                    {submitQuote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrer kunde
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
