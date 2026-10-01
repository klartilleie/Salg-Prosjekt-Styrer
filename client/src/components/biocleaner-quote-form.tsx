import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Check, Loader2, Mail, MapPin, Phone, User } from "lucide-react";
import {
  BIOCLEANER_MODELS,
  BIOCLEANER_TYPES,
  DEFAULT_PRICES,
  GRAVING_OPTIONS,
  ETTERPOLLERINGSKUM,
  ETTERPOLLERING_PLUS,
  FRAKT_REGIONS,
  OTHER_PRICES,
  PRICE_LIST_DATE,
  STYRESKAP_OPTIONS,
  UTEHUS_PRICE,
  UV_LAMPE,
  formatKr,
  previewQuote,
  quoteFormSchema,
  type QuoteFormData,
} from "@shared/biocleaner-offer";

interface AddressSuggestion {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenavn: string;
  adressenavn?: string;
  nummer?: string | number;
}

const defaultValues: QuoteFormData = {
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
  styreskapSize: "small",
  utehus: "nei",
  gravingPrice: DEFAULT_PRICES.graving,
  fraktPrice: DEFAULT_PRICES.frakt,
  fraktRegion: "",
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

export function BiocleanerQuoteForm() {
  const [sent, setSent] = useState<{ emailSent: boolean; emailReason?: string } | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues,
  });

  const values = form.watch();
  const preview = previewQuote(values);
  const model = BIOCLEANER_MODELS.find((item) => item.id === values.biocleanerModel);

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

  useEffect(() => {
    if (model && model.optimaPrice == null && values.biocleanerType === "optima") {
      form.setValue("biocleanerType", "comfort");
    }
    if (model && !model.rings && values.tilleggsring !== "none") {
      form.setValue("tilleggsring", "none");
    }
  }, [model, values.biocleanerType, values.tilleggsring, form]);

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

  const onSubmit = async (data: QuoteFormData) => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const raw = await res.text();
      const body = raw ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : null;
      if (!res.ok) {
        const message = typeof body === "string" ? body : body?.message;
        throw new Error(message || "Kunne ikke sende tilbudet");
      }
      setSent({ emailSent: Boolean(body?.emailSent), emailReason: body?.emailReason });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Kunne ikke sende tilbudet");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold">Tilbudet er sendt til godkjenning</h2>
          <p className="text-muted-foreground">
            {preview ? `FRA-totalpris ${formatKr(preview.total)}. ` : ""}
            Administrator kan skrive ut tilbudet som PDF. Tilbudet er gyldig i 30 dager.
          </p>
          <p className="text-sm text-muted-foreground">
            {sent.emailSent
              ? "Administrator er varslet på e-post."
              : `E-postvarselet ble ikke sendt${sent.emailReason ? `: ${sent.emailReason}` : ""}. Tilbudet ligger likevel til godkjenning.`}
          </p>
          <Button variant="outline" onClick={() => { form.reset(defaultValues); setAddressQuery(""); setSent(null); }}>
            Lag et nytt tilbud
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
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
            <p className="text-sm text-muted-foreground">Priser eks. mva fra prislisten {PRICE_LIST_DATE}. Basic utgår.</p>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="biocleanerModel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Biocleaner-modell</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-biocleaner-model"><SelectValue placeholder="Velg modell" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Inntil 50 PE</SelectLabel>
                        {BIOCLEANER_MODELS.filter((item) => item.group === "standard").map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Over 50 PE, kapittel 13</SelectLabel>
                        {BIOCLEANER_MODELS.filter((item) => item.group === "large").map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="biocleanerType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-biocleaner-type"><SelectValue placeholder="Velg type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {BIOCLEANER_TYPES.map((type) => {
                        const disabled = type.id === "optima" && !!model && model.optimaPrice == null;
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

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="styreskapSize" render={({ field }) => (
                <FormItem>
                  <FormLabel>Styreskap</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STYRESKAP_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.name} ({formatKr(option.defaultPrice)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="utehus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Utehus til styring ({formatKr(UTEHUS_PRICE)})</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="nei">Nei</SelectItem>
                      <SelectItem value="ja">Ja</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="gravingPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Graving med singel</FormLabel>
                  <Select value={String(field.value)} onValueChange={(value) => field.onChange(parseInt(value, 10))}>
                    <FormControl><SelectTrigger data-testid="select-graving-price"><SelectValue placeholder="Velg pris" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {GRAVING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="fraktRegion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frakt fra nærmeste lager</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-frakt-region"><SelectValue placeholder="Velg region" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {FRAKT_REGIONS.map((region) => (
                        <SelectItem key={region.id} value={region.id}>{region.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fraktPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fraktbeløp eks. mva</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} value={field.value} onChange={(event) => field.onChange(Number(event.target.value))} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Frakt beregnes fra lager og legges inn her. For anlegg over 50 PE avtales frakt, installasjon og service særskilt.</p>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tilleggsutstyr</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <YesNo name="pumpekumme" label={`Pumpekumme komplett (${formatKr(OTHER_PRICES.pumpekumme)})`} form={form} />
            <FormField control={form.control} name="airPumpe" render={({ field }) => (
              <FormItem>
                <FormLabel>Air-pumpe</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ingen</SelectItem>
                    <SelectItem value="60">60 ({formatKr(OTHER_PRICES.air60)})</SelectItem>
                    <SelectItem value="80">80 ({formatKr(OTHER_PRICES.air80)})</SelectItem>
                    <SelectItem value="120">120 ({formatKr(OTHER_PRICES.air120)})</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <YesNo name="pumpeKjemi" label={`Pumpe kjemi (${formatKr(OTHER_PRICES.pumpeKjemi)})`} form={form} />
            <YesNo name="pumpeTilKumme" label={`Pumpe til kumme (${formatKr(OTHER_PRICES.pumpeTilKumme)})`} form={form} />
            <FormField control={form.control} name="tilleggsring" render={({ field }) => (
              <FormItem>
                <FormLabel>Tilleggsringer</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={!!model && !model.rings}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ingen</SelectItem>
                    <SelectItem value="60">60 cm{model?.rings ? ` (${formatKr(model.rings["60"])})` : ""}</SelectItem>
                    <SelectItem value="80">80 cm{model?.rings ? ` (${formatKr(model.rings["80"])})` : ""}</SelectItem>
                    <SelectItem value="100">100 cm{model?.rings ? ` (${formatKr(model.rings["100"])})` : ""}</SelectItem>
                  </SelectContent>
                </Select>
                {model && !model.rings && <p className="text-xs text-muted-foreground">Ikke i prislisten for denne modellen.</p>}
              </FormItem>
            )} />
            <FormField control={form.control} name="tilleggsringAntall" render={({ field }) => (
              <FormItem>
                <FormLabel>Antall tilleggsringer</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={20} value={field.value} onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 0)} disabled={values.tilleggsring === "none"} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <SizeSelect name="etterpolleringskum" label="Etterpolleringskum" options={ETTERPOLLERINGSKUM} form={form} />
            <SizeSelect name="etterpolleringPlus" label="Etterpollering +" options={ETTERPOLLERING_PLUS} form={form} />
            <SizeSelect name="uvLampe" label="UV-lampe" options={UV_LAMPE} form={form} />
            <FormField control={form.control} name="aluminiumFatLiter" render={({ field }) => (
              <FormItem>
                <FormLabel>Aluminiumsfat, liter ({formatKr(OTHER_PRICES.aluminiumFatPerLiter)} pr liter)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.1" value={field.value} onChange={(event) => field.onChange(Number(event.target.value))} />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="serviceKjoring" render={({ field }) => (
              <FormItem>
                <FormLabel>Kjøring ved service, per besøk</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ikke inkludert</SelectItem>
                    <SelectItem value="innen50">Inntil 50 km ({formatKr(OTHER_PRICES.serviceInnen50)})</SelectItem>
                    <SelectItem value="over50">Over 50 km ({formatKr(OTHER_PRICES.serviceOver50)})</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="serviceBesok" render={({ field }) => (
              <FormItem>
                <FormLabel>Antall servicebesøk</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={12} value={field.value} onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 0)} disabled={values.serviceKjoring === "none"} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prisdetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!preview && <p className="text-sm text-muted-foreground">Velg modell for å se prisen.</p>}
            {preview?.lines.map((line) => (
              <div key={line.label} className="flex items-start justify-between gap-4 text-sm">
                <span className="min-w-0">{line.label}</span>
                <span className="shrink-0 tabular-nums">{formatKr(line.amount)}</span>
              </div>
            ))}
            {preview && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm font-medium"><span>Sum</span><span data-testid="text-offer-sum">{formatKr(preview.sum)}</span></div>
                <div className="flex justify-between text-sm"><span>Mva (25%)</span><span data-testid="text-offer-mva">{formatKr(preview.mva)}</span></div>
                <div className="flex justify-between border-t pt-2 font-semibold"><span>FRA - Totalpris</span><span data-testid="text-offer-total">{formatKr(preview.total)}</span></div>
                <div className="flex justify-between font-semibold"><span>TIL - Totalpris inkl. avsetning</span><span>{formatKr(preview.tilTotal)}</span></div>
                <p className="text-xs text-muted-foreground">
                  Dette beløpet inkluderer en avsetning på inntil 20 000 kr for å dekke uforutsette utfordringer i arbeidet (f.eks. ved behov for sprengning, kiling av fjell, fjerning av uventede masser eller ekstra sikring). Dette beløpet faktureres kun dersom slike forhold oppstår, og etter nærmere avtale med kunden.
                </p>
                <p className="text-sm">
                  {preview.serviceAnnual != null
                    ? `Årlig servicekostnad: ${formatKr(preview.serviceAnnual)}. Fordeles på to servicebesøk og er ikke med i totalprisen.`
                    : "Årlig servicekostnad er ikke oppgitt for denne modellen."}
                </p>
              </div>
            )}
            <span className="sr-only" data-testid="input-biocleaner-price">{preview?.lines[0]?.amount ?? 0}</span>
          </CardContent>
        </Card>

        <FormField control={form.control} name="offerComments" render={({ field }) => (
          <FormItem>
            <FormLabel>Kommentarer til tilbudet</FormLabel>
            <FormControl><Textarea className="min-h-24" placeholder="Eventuelle tilleggsopplysninger eller kommentarer..." {...field} /></FormControl>
          </FormItem>
        )} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vilkår for tilbud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Dette tilbudet er gyldig i 30 dager fra datering.</p>
            <p><strong>Offentlige gebyrer:</strong> Alle oppgitte priser er eksklusive saksbehandlingsgebyrer fra kommunen. Slike gebyrer faktureres direkte fra kommunen til kunden.</p>
            <p><strong>Forbehold:</strong> Tilbudet forutsetter godkjent utslippstillatelse fra kommunen basert på prosjektert plassering i kartet.</p>
            <p><strong>Kontrakt:</strong> Endelige vilkår, garantier og fremdriftsplan fremkommer i den formelle utførelseskontrakten og ikke i dette tilbudet.</p>
            <p>Når skjemaet sendes, går tilbudet til administrator for godkjenning og utskrift i PDF. Administrator varsles på e-post.</p>
          </CardContent>
        </Card>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <div className="flex justify-end pb-8">
          <Button type="submit" size="lg" className="w-full md:w-auto md:min-w-48" disabled={isSubmitting} data-testid="button-submit-form">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send til godkjenning
          </Button>
        </div>
      </form>
    </Form>
  );
}

function YesNo({
  name,
  label,
  form,
}: {
  name: "pumpekumme" | "pumpeKjemi" | "pumpeTilKumme";
  label: string;
  form: ReturnType<typeof useForm<QuoteFormData>>;
}) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select value={field.value} onValueChange={field.onChange}>
          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
          <SelectContent>
            <SelectItem value="nei">Nei</SelectItem>
            <SelectItem value="ja">Ja</SelectItem>
          </SelectContent>
        </Select>
      </FormItem>
    )} />
  );
}

function SizeSelect({
  name,
  label,
  options,
  form,
}: {
  name: "etterpolleringskum" | "etterpolleringPlus" | "uvLampe";
  label: string;
  options: readonly { id: string; name: string; price: number }[];
  form: ReturnType<typeof useForm<QuoteFormData>>;
}) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select value={field.value} onValueChange={field.onChange}>
          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
          <SelectContent>
            <SelectItem value="none">Ingen</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>{option.name} ({formatKr(option.price)})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItem>
    )} />
  );
}
