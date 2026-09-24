import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Check, Home, Loader2, MapPin, Search, Smartphone } from "lucide-react";

const quoteSchema = z.object({
  firstName: z.string().min(2, "Fornavn må ha minst 2 tegn"),
  lastName: z.string().min(2, "Etternavn må ha minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  phone: z.string().min(8, "Telefonnummer må ha minst 8 siffer"),
  address: z.string().min(5, "Adresse er påkrevd"),
  postalCode: z.string().regex(/^\d{4}$/, "Postnummer må være 4 siffer"),
  city: z.string().min(2, "Poststed er påkrevd"),
  municipality: z.string().optional(),
  notes: z.string().min(2, "Fortell kort hva du ønsker tilbud på"),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface AddressSuggestion {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenavn: string;
}

const steps = ["Kontakt", "Adresse", "Tilbudet"];

export default function WebsitePage() {
  const [step, setStep] = useState(0);
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
        throw new Error(text || "Kunne ikke sende tilbudet");
      }
      return res.json();
    },
    onSuccess: () => setSent(true),
  });

  const nextStep = async () => {
    const fields: (keyof QuoteFormData)[][] = [
      ["firstName", "lastName", "email", "phone"],
      ["address", "postalCode", "city"],
      ["notes"],
    ];
    const valid = await form.trigger(fields[step]);
    if (!valid) return;
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    submitQuote.mutate(form.getValues());
  };

  const selectAddress = (suggestion: AddressSuggestion) => {
    form.setValue("address", suggestion.adressetekst, { shouldValidate: true });
    form.setValue("postalCode", suggestion.postnummer, { shouldValidate: true });
    form.setValue("city", suggestion.poststed, { shouldValidate: true });
    form.setValue("municipality", suggestion.kommunenavn);
    setAddressQuery("");
    setAddressSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="#skjema" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </span>
            Tilbud
          </a>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <a href="#skjema">Be om tilbud</a>
            </Button>
            <Button asChild>
              <Link href="/logg-inn">Åpne appen</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-5">
            <p className="text-sm font-medium text-primary">SmartHjem</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Be om tilbud på noen minutter</h1>
            <p className="text-lg text-muted-foreground">
              Fyll ut skjemaet med kontakt, adresse og hva du ønsker. Forespørselen går rett til behandlingen i appen.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Kontakt", "Adresse", "Send"].map((label, index) => (
                <div key={label} className="rounded-xl border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Steg {index + 1}</p>
                  <p className="font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <Card id="skjema" className="scroll-mt-24">
            <CardContent className="p-6">
              {sent ? (
                <div className="space-y-4 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-semibold">Tilbudet er sendt</h2>
                  <p className="text-muted-foreground">Vi har mottatt forespørselen og tar kontakt på telefon eller e-post.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setStep(0);
                      setSent(false);
                    }}
                  >
                    Send et nytt tilbud
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    className="space-y-5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      nextStep();
                    }}
                  >
                    <div>
                      <p className="text-sm text-muted-foreground">Steg {step + 1} av 3</p>
                      <h2 className="text-xl font-semibold">{steps[step]}</h2>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {steps.map((label, index) => (
                          <div
                            key={label}
                            className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`}
                          />
                        ))}
                      </div>
                    </div>

                    {step === 0 && (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fornavn</FormLabel>
                                <FormControl>
                                  <Input autoComplete="given-name" data-testid="quote-first-name" {...field} />
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
                                  <Input autoComplete="family-name" data-testid="quote-last-name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-post</FormLabel>
                              <FormControl>
                                <Input type="email" autoComplete="email" data-testid="quote-email" {...field} />
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
                                <Input type="tel" autoComplete="tel" data-testid="quote-phone" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {step === 1 && (
                      <div className="space-y-4">
                        <div className="relative">
                          <FormLabel>Søk adresse</FormLabel>
                          <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              className="pl-10"
                              placeholder="Søk i Kartverket"
                              value={addressQuery}
                              onChange={(event) => setAddressQuery(event.target.value)}
                              data-testid="quote-address-search"
                            />
                            {isSearchingAddress && (
                              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                            )}
                          </div>
                          {addressSuggestions.length > 0 && (
                            <Card className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto">
                              <CardContent className="p-0">
                                {addressSuggestions.map((suggestion, index) => (
                                  <button
                                    key={`${suggestion.adressetekst}-${index}`}
                                    type="button"
                                    className="flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted"
                                    onClick={() => selectAddress(suggestion)}
                                  >
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span>
                                      <span className="block font-medium">{suggestion.adressetekst}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {suggestion.postnummer} {suggestion.poststed}
                                      </span>
                                    </span>
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
                                <Input data-testid="quote-address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postnr</FormLabel>
                                <FormControl>
                                  <Input data-testid="quote-postal-code" {...field} />
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
                                  <Input data-testid="quote-city" {...field} />
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
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hva ønsker du tilbud på?</FormLabel>
                            <FormControl>
                              <Textarea rows={6} data-testid="quote-notes" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {submitQuote.isError && (
                      <p className="text-sm text-destructive">{submitQuote.error.message}</p>
                    )}

                    <div className="flex gap-3">
                      {step > 0 && (
                        <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                          Tilbake
                        </Button>
                      )}
                      <Button type="submit" className="flex-1" disabled={submitQuote.isPending} data-testid="quote-next">
                        {submitQuote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {step === 2 ? "Send tilbud" : "Neste"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="border-t bg-card">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-1 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Samme løsning som app</h2>
                <p className="text-sm text-muted-foreground">
                  Selgere og administratorer følger opp tilbudene i appen. Legg den til på hjemskjermen etter innlogging.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/logg-inn">Logg inn i appen</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
