import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Check, Loader2, Mail, MapPin, Phone, User } from "lucide-react";
import {
  BIOCLEANER_MODELS,
  BIOCLEANER_TYPES,
  DEFAULT_PRICES,
  GRAVING_OPTIONS,
  STYRESKAP_OPTIONS,
  biocleanerPrice,
} from "@shared/biocleaner-offer";

const quoteSchema = z.object({
  customerName: z.string().min(2, "Skriv inn kundens navn"),
  customerAddress: z.string().min(5, "Velg en adresse"),
  streetName: z.string().optional(),
  houseNumber: z.string().optional(),
  postalCode: z.string().regex(/^\d{4}$/, "Postnummer må være 4 siffer"),
  city: z.string().min(2, "Poststed er påkrevd"),
  municipality: z.string().optional(),
  customerEmail: z.string().email("Ugyldig e-postadresse"),
  customerPhone: z.string().min(8, "Telefonnummer må ha minst 8 siffer"),
  biocleanerModel: z.string().min(1, "Velg modell"),
  biocleanerType: z.string().min(1, "Velg type"),
  numberOfHomes: z.string().min(1, "Oppgi antall"),
  biocleanerPrice: z.number(),
  styreskapSize: z.string(),
  styreskapPrice: z.number(),
  utehus: z.string(),
  utehusPrice: z.number(),
  soknadUtslippPrice: z.number(),
  soknadDispensasjonPrice: z.number(),
  innreguleringPrice: z.number(),
  gravingPrice: z.number(),
  fraktPrice: z.number(),
  offerComments: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface AddressSuggestion {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenavn: string;
  adressenavn?: string;
  nummer?: string | number;
}

function kroner(value: number) {
  return `kr ${value.toLocaleString("nb-NO")},-`;
}

export function BiocleanerQuoteForm() {
  const [sent, setSent] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customerName: "",
      customerAddress: "",
      streetName: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      municipality: "",
      customerEmail: "",
      customerPhone: "",
      biocleanerModel: "",
      biocleanerType: "optima",
      numberOfHomes: "1",
      biocleanerPrice: 0,
      styreskapSize: "small",
      styreskapPrice: STYRESKAP_OPTIONS[0].defaultPrice,
      utehus: "nei",
      utehusPrice: 0,
      soknadUtslippPrice: DEFAULT_PRICES.soknadUtslipp,
      soknadDispensasjonPrice: DEFAULT_PRICES.soknadDispensasjon,
      innreguleringPrice: DEFAULT_PRICES.innregulering,
      gravingPrice: DEFAULT_PRICES.graving,
      fraktPrice: DEFAULT_PRICES.frakt,
      offerComments: "",
    },
  });

  const prices = form.watch([
    "biocleanerPrice",
    "styreskapPrice",
    "utehusPrice",
    "soknadUtslippPrice",
    "soknadDispensasjonPrice",
    "innreguleringPrice",
    "gravingPrice",
    "fraktPrice",
  ]);
  const sum = prices.reduce((total, value) => total + (Number(value) || 0), 0);
  const mva = Math.round(sum * 0.25);
  const total = sum + mva;

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

  const selectAddress = (suggestion: AddressSuggestion) => {
    form.setValue("customerAddress", suggestion.adressetekst, { shouldValidate: true });
    form.setValue("streetName", suggestion.adressenavn || "");
    form.setValue("houseNumber", suggestion.nummer != null ? String(suggestion.nummer) : "");
    form.setValue("postalCode", suggestion.postnummer, { shouldValidate: true });
    form.setValue("city", suggestion.poststed, { shouldValidate: true });
    form.setValue("municipality", suggestion.kommunenavn || "");
    setAddressQuery(suggestion.adressetekst);
    setAddressSuggestions([]);
  };

  const setModel = (modelId: string) => {
    const model = BIOCLEANER_MODELS.find((item) => item.id === modelId);
    let typeId = form.getValues("biocleanerType") || "optima";
    if (typeId === "optima" && model?.optimaPrice === null) {
      typeId = "comfort";
      form.setValue("biocleanerType", typeId);
    }
    form.setValue("biocleanerModel", modelId, { shouldValidate: true });
    form.setValue("biocleanerPrice", biocleanerPrice(modelId, typeId));
  };

  const setType = (typeId: string) => {
    form.setValue("biocleanerType", typeId, { shouldValidate: true });
    const modelId = form.getValues("biocleanerModel");
    if (modelId) form.setValue("biocleanerPrice", biocleanerPrice(modelId, typeId));
  };

  const submitQuote = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, offerSum: sum, offerMva: mva, offerTotal: total }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Kunne ikke sende tilbudet");
      }
      return res.json();
    },
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold">Tilbudet er sendt</h2>
          <p className="text-muted-foreground">FRA-totalpris {kroner(total)}. Tilbudet er gyldig i 30 dager.</p>
          <Button variant="outline" onClick={() => { form.reset(); setAddressQuery(""); setSent(false); }}>
            Lag et nytt tilbud
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit((data) => submitQuote.mutate(data))}>
        <Card>
          <CardHeader>
            <CardTitle>Kunde- og prosjektdetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="customerName" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" /> Kunde Navn *</FormLabel>
                <FormControl><Input placeholder="Skriv inn kundens navn" data-testid="input-customer-name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="relative">
              <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Søk etter adresse *</FormLabel>
              <div className="relative mt-2">
                <Input placeholder="Begynn å skrive adresse..." value={addressQuery} onChange={(event) => setAddressQuery(event.target.value)} data-testid="input-customer-address" />
                {isSearchingAddress && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />}
              </div>
              {addressSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-lg">
                  {addressSuggestions.map((suggestion, index) => (
                    <button key={`${suggestion.adressetekst}-${index}`} type="button" className="w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent" onClick={() => selectAddress(suggestion)}>
                      <div className="font-medium">{suggestion.adressetekst}</div>
                      <div className="text-xs text-muted-foreground">{suggestion.postnummer} {suggestion.poststed}, {suggestion.kommunenavn}</div>
                    </button>
                  ))}
                </div>
              )}
              {form.formState.errors.customerAddress && <p className="mt-1 text-sm text-destructive">{form.formState.errors.customerAddress.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="streetName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vegnavn</FormLabel>
                  <FormControl><Input readOnly className="bg-muted" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="houseNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Husnummer</FormLabel>
                  <FormControl><Input readOnly className="bg-muted" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="postalCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Postnummer</FormLabel>
                  <FormControl><Input readOnly className="bg-muted" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>Poststed</FormLabel>
                  <FormControl><Input readOnly className="bg-muted" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="customerEmail" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> Kunde E-post *</FormLabel>
                <FormControl><Input type="email" placeholder="eksempel@epost.no" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="customerPhone" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" /> Kundens Telefonnummer *</FormLabel>
                <FormControl><Input type="tel" placeholder="+47 XXX XX XXX" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5" />
              Tilbud på Biocleaner renseanlegg
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="biocleanerModel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Biocleaner-modell</FormLabel>
                  <Select value={field.value} onValueChange={setModel}>
                    <FormControl><SelectTrigger data-testid="select-biocleaner-model"><SelectValue placeholder="Velg modell" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {BIOCLEANER_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="biocleanerType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={setType}>
                    <FormControl><SelectTrigger data-testid="select-biocleaner-type"><SelectValue placeholder="Velg type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {BIOCLEANER_TYPES.map((type) => {
                        const model = BIOCLEANER_MODELS.find((item) => item.id === form.getValues("biocleanerModel"));
                        const disabled = type.id === "optima" && !!model && model.optimaPrice === null;
                        return (
                          <SelectItem key={type.id} value={type.id} disabled={disabled}>
                            {type.name} - {type.description}{disabled ? " (utgår)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numberOfHomes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Antall boliger/hytter</FormLabel>
                  <FormControl><Input placeholder="f.eks. 1 enebolig" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <h4 className="text-sm font-medium text-muted-foreground">Prisdetaljer</h4>
              <PriceRow label="Biocleaner renseanlegg">
                <FormField control={form.control} name="biocleanerPrice" render={({ field }) => (
                  <NumberPrice value={field.value} onChange={(value) => field.onChange(value)} testId="input-biocleaner-price" />
                )} />
              </PriceRow>
              <PriceRow label="Styreskap">
                <FormField control={form.control} name="styreskapSize" render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => {
                    field.onChange(value);
                    const option = STYRESKAP_OPTIONS.find((item) => item.id === value);
                    if (option) form.setValue("styreskapPrice", option.defaultPrice);
                  }}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYRESKAP_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                <FormField control={form.control} name="styreskapPrice" render={({ field }) => (
                  <Input readOnly className="w-28 bg-muted text-right" value={field.value} />
                )} />
              </PriceRow>
              <PriceRow label="Utehus til styring">
                <FormField control={form.control} name="utehus" render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("utehusPrice", value === "ja" ? 10000 : 0);
                  }}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">Ja</SelectItem>
                      <SelectItem value="nei">Nei</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                <FormField control={form.control} name="utehusPrice" render={({ field }) => (
                  <Input readOnly className="w-28 bg-muted text-right" value={field.value} />
                )} />
              </PriceRow>
              <LockedPrice label="Søknad om utslipp" name="soknadUtslippPrice" form={form} />
              <LockedPrice label="Søknad om dispensasjon" name="soknadDispensasjonPrice" form={form} />
              <LockedPrice label="Innregulering/oppstart/montering" name="innreguleringPrice" form={form} />
              <PriceRow label="Graving med singel" suffix={false}>
                <FormField control={form.control} name="gravingPrice" render={({ field }) => (
                  <Select value={String(field.value)} onValueChange={(value) => field.onChange(parseInt(value, 10))}>
                    <SelectTrigger className="w-36" data-testid="select-graving-price"><SelectValue placeholder="Velg pris" /></SelectTrigger>
                    <SelectContent>
                      {GRAVING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </PriceRow>
              <LockedPrice label="Frakt" name="fraktPrice" form={form} />
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm font-medium"><span>Sum</span><span data-testid="text-offer-sum">{kroner(sum)}</span></div>
                <div className="flex justify-between text-sm"><span>Mva (25%)</span><span data-testid="text-offer-mva">{kroner(mva)}</span></div>
                <div className="flex justify-between border-t pt-2 font-semibold"><span>FRA - Totalpris</span><span data-testid="text-offer-total">{kroner(total)}</span></div>
                <div className="flex justify-between font-semibold"><span>TIL - Totalpris inkl. avsetning</span><span>{kroner(total + 20000)}</span></div>
                <p className="text-xs text-muted-foreground">
                  Dette beløpet inkluderer en avsetning på inntil 20 000 kr for å dekke uforutsette utfordringer i arbeidet (f.eks. ved behov for sprengning, kiling av fjell, fjerning av uventede masser eller ekstra sikring). Dette beløpet faktureres kun dersom slike forhold oppstår, og etter nærmere avtale med kunden.
                </p>
              </div>
            </div>

            <FormField control={form.control} name="offerComments" render={({ field }) => (
              <FormItem>
                <FormLabel>Kommentarer til tilbudet</FormLabel>
                <FormControl><Textarea className="min-h-24" placeholder="Eventuelle tilleggsopplysninger eller kommentarer..." {...field} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vilkår for tilbud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Dette tilbudet er gyldig i 30 dager fra datering.</p>
            <p><strong>Offentlige gebyrer:</strong> Alle oppgitte priser er eksklusive saksbehandlingsgebyrer fra kommunen. Slike gebyrer faktureres direkte fra kommunen til kunden.</p>
            <p><strong>Forbehold:</strong> Tilbudet forutsetter godkjent utslippstillatelse fra kommunen basert på prosjektert plassering i kartet.</p>
            <p><strong>Kontrakt:</strong> Endelige vilkår, garantier og fremdriftsplan fremkommer i den formelle utførelseskontrakten og ikke i dette tilbudet.</p>
          </CardContent>
        </Card>

        {submitQuote.isError && <p className="text-sm text-destructive">{submitQuote.error.message}</p>}
        <div className="flex justify-end pb-8">
          <Button type="submit" size="lg" className="w-full md:w-auto md:min-w-48" disabled={submitQuote.isPending} data-testid="button-submit-form">
            {submitQuote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send tilbud
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PriceRow({ label, children, suffix = true }: { label: string; children: React.ReactNode; suffix?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {children}
        {suffix && <span className="text-sm text-muted-foreground">kr</span>}
      </div>
    </div>
  );
}

function NumberPrice({ value, onChange, testId }: { value: number; onChange: (value: number) => void; testId: string }) {
  return (
    <Input
      type="number"
      className="w-28 text-right"
      data-testid={testId}
      value={value}
      onChange={(event) => onChange(parseInt(event.target.value, 10) || 0)}
    />
  );
}

function LockedPrice({
  label,
  name,
  form,
}: {
  label: string;
  name: "soknadUtslippPrice" | "soknadDispensasjonPrice" | "innreguleringPrice" | "fraktPrice";
  form: ReturnType<typeof useForm<QuoteFormData>>;
}) {
  return (
    <PriceRow label={label}>
      <FormField control={form.control} name={name} render={({ field }) => (
        <Input readOnly className="w-28 bg-muted text-right" value={field.value} />
      )} />
    </PriceRow>
  );
}
