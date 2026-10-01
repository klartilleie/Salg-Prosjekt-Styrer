import { z } from "zod";

export const PRICE_LIST_DATE = "01.01.2025";
export const QUOTE_VALID_DAYS = 30;
export const CONTINGENCY_AMOUNT = 20000;
export const UTEHUS_PRICE = 10000;

export const BIOCLEANER_MODELS = [
  { id: "bc6", name: "BC 6 (1-6 PE)", pe: 6, volume: "3,0 m³", group: "standard", optimaPrice: 78349, comfortPrice: 85790, exclusiveTillegg: 12274, serviceAnnual: 5971, rings: { "60": 5934, "80": 7590, "100": 10212 } },
  { id: "bc10", name: "BC 10 (1-10 PE)", pe: 10, volume: "5,0 m³", group: "standard", optimaPrice: 98792, comfortPrice: 104890, exclusiveTillegg: 12586, serviceAnnual: 7160, rings: { "60": 6486, "80": 7728, "100": 11592 } },
  { id: "bc12", name: "BC 12 (1-12 PE)", pe: 12, volume: "6,0 m³", group: "standard", optimaPrice: 115385, comfortPrice: 123675, exclusiveTillegg: 13654, serviceAnnual: 8101, rings: { "60": 7728, "80": 9246, "100": 13248 } },
  { id: "bc16", name: "BC 16 (1-16 PE)", pe: 16, volume: "8,0 m³", group: "standard", optimaPrice: null, comfortPrice: 151671, exclusiveTillegg: 13654, serviceAnnual: 9230, rings: { "60": 9936, "80": 12282, "100": 16698 } },
  { id: "bc20", name: "BC 20 (1-20 PE)", pe: 20, volume: "10,0 m³", group: "standard", optimaPrice: null, comfortPrice: 181439, exclusiveTillegg: 13654, serviceAnnual: 11194, rings: { "60": 12351, "80": 15456, "100": 18906 } },
  { id: "bc25", name: "BC 25 (1-25 PE)", pe: 25, volume: "12,5 m³", group: "standard", optimaPrice: null, comfortPrice: 223543, exclusiveTillegg: 15456, serviceAnnual: 13904, rings: { "60": 12696, "80": 16008, "100": 19872 } },
  { id: "bc30", name: "BC 30 (1-30 PE)", pe: 30, volume: "15,0 m³", group: "standard", optimaPrice: null, comfortPrice: 254672, exclusiveTillegg: 16836, serviceAnnual: 18523, rings: null },
  { id: "bc40", name: "BC 40 (1-40 PE)", pe: 40, volume: null, group: "standard", optimaPrice: null, comfortPrice: 269935, exclusiveTillegg: 18680, serviceAnnual: null, rings: null },
  { id: "bc50", name: "BC 50 (1-50 PE)", pe: 50, volume: "25,0 m³", group: "standard", optimaPrice: null, comfortPrice: 283542, exclusiveTillegg: 20286, serviceAnnual: 20845, rings: null },
  { id: "bc60", name: "BC 60 (over 50 PE)", pe: 60, volume: null, group: "large", optimaPrice: null, comfortPrice: 367980, exclusiveTillegg: 22689, serviceAnnual: 24670, rings: null },
  { id: "bc75", name: "BC 75 (over 50 PE)", pe: 75, volume: null, group: "large", optimaPrice: null, comfortPrice: 397750, exclusiveTillegg: 42204, serviceAnnual: 28110, rings: null },
  { id: "bc100", name: "BC 100 (over 50 PE)", pe: 100, volume: null, group: "large", optimaPrice: null, comfortPrice: 439671, exclusiveTillegg: 60781, serviceAnnual: 31210, rings: null },
  { id: "bc150", name: "BC 150 (over 50 PE)", pe: 150, volume: null, group: "large", optimaPrice: null, comfortPrice: 496195, exclusiveTillegg: 73366, serviceAnnual: 38510, rings: null },
  { id: "bc200", name: "BC 200 (over 50 PE)", pe: 200, volume: null, group: "large", optimaPrice: null, comfortPrice: 568577, exclusiveTillegg: 84068, serviceAnnual: 43580, rings: null },
  { id: "bc250", name: "BC 250 (over 50 PE)", pe: 250, volume: null, group: "large", optimaPrice: null, comfortPrice: 657549, exclusiveTillegg: 97223, serviceAnnual: 45980, rings: null },
  { id: "bc300", name: "BC 300 (over 50 PE)", pe: 300, volume: null, group: "large", optimaPrice: null, comfortPrice: 730971, exclusiveTillegg: 108079, serviceAnnual: 52500, rings: null },
  { id: "bc400", name: "BC 400 (over 50 PE)", pe: 400, volume: null, group: "large", optimaPrice: null, comfortPrice: 938681, exclusiveTillegg: 138790, serviceAnnual: 57210, rings: null },
  { id: "bc500", name: "BC 500 (over 50 PE)", pe: 500, volume: null, group: "large", optimaPrice: null, comfortPrice: 1056728, exclusiveTillegg: 156244, serviceAnnual: 65880, rings: null },
] as const;

export type BiocleanerModel = (typeof BIOCLEANER_MODELS)[number];

export const BIOCLEANER_TYPES = [
  { id: "optima", name: "Optima", description: "Standard-løsning" },
  { id: "comfort", name: "Comfort", description: "Med fjernstyring" },
  { id: "exclusive", name: "Exclusive", description: "Comfort med tertiærfilter" },
] as const;

export const STYRESKAP_OPTIONS = [
  { id: "small", name: "Small", defaultPrice: 6944 },
  { id: "medium", name: "Medium", defaultPrice: 8960 },
  { id: "large", name: "Large", defaultPrice: 15232 },
] as const;

export const GRAVING_OPTIONS = [
  { value: 25000, label: "25 000 kr" },
  { value: 35000, label: "35 000 kr" },
  { value: 45000, label: "45 000 kr" },
  { value: 55000, label: "55 000 kr" },
  { value: 65000, label: "65 000 kr" },
  { value: 75000, label: "75 000 kr" },
  { value: 85000, label: "85 000 kr" },
  { value: 95000, label: "95 000 kr" },
  { value: 105000, label: "105 000 kr" },
] as const;

export const FRAKT_REGIONS = [
  { id: "trondheim-nord", label: "Trondheim og nordover, lager Bodø" },
  { id: "sor-trondheim", label: "Sør for Trondheim, lager Bergen" },
  { id: "ostlandet", label: "Østlandet, lager Bergen" },
] as const;

export const OTHER_PRICES = {
  pumpekumme: 50508,
  air60: 4761,
  air80: 6762,
  air120: 9108,
  pumpeKjemi: 5796,
  pumpeTilKumme: 25254,
  serviceInnen50: 710,
  serviceOver50: 850,
  aluminiumFatPerLiter: 25.5,
} as const;

export const ETTERPOLLERINGSKUM = [
  { id: "small", name: "Small (6-10)", price: 8064 },
  { id: "medium", name: "Medium (10-16)", price: 10080 },
  { id: "large", name: "Large (over 16)", price: 17203.2 },
] as const;

export const ETTERPOLLERING_PLUS = [
  { id: "small", name: "Small", price: 11558.4 },
  { id: "medium", name: "Medium", price: 13708.8 },
  { id: "large", name: "Large", price: 21907.2 },
] as const;

export const UV_LAMPE = [
  { id: "small", name: "Small", price: 3840 },
  { id: "medium", name: "Medium", price: 5400 },
  { id: "large", name: "Large", price: 8640 },
] as const;

export const DEFAULT_PRICES = {
  soknadUtslipp: 12500,
  soknadDispensasjon: 7500,
  innregulering: 16900,
  graving: 25000,
  frakt: 6200,
} as const;

const SIZE_OPTIONS = ["none", "small", "medium", "large"] as const;
const RING_OPTIONS = ["none", "60", "80", "100"] as const;

export const quoteFormSchema = z.object({
  customerName: z.string().trim().min(2, "Skriv inn kundens navn"),
  customerAddress: z.string().trim().min(5, "Velg en adresse"),
  streetName: z.string().optional(),
  houseNumber: z.string().optional(),
  postalCode: z.string().regex(/^\d{4}$/, "Postnummer må være 4 siffer"),
  city: z.string().trim().min(2, "Poststed er påkrevd"),
  municipality: z.string().optional(),
  customerEmail: z.string().trim().email("Ugyldig e-postadresse"),
  customerPhone: z.string().trim().min(8, "Telefonnummer må ha minst 8 siffer"),
  biocleanerModel: z.string().min(1, "Velg modell"),
  biocleanerType: z.enum(["optima", "comfort", "exclusive"]),
  numberOfHomes: z.string().trim().min(1, "Oppgi antall"),
  styreskapSize: z.enum(["small", "medium", "large"]),
  utehus: z.enum(["ja", "nei"]),
  gravingPrice: z.number().refine(
    (value) => GRAVING_OPTIONS.some((option) => option.value === value),
    "Velg gravepris",
  ),
  fraktPrice: z.number().min(0, "Frakt kan ikke være negativ").max(2_000_000),
  fraktRegion: z.string().refine(
    (value) => FRAKT_REGIONS.some((region) => region.id === value),
    "Velg fraktregion",
  ),
  pumpekumme: z.enum(["nei", "ja"]),
  airPumpe: z.enum(["none", "60", "80", "120"]),
  pumpeKjemi: z.enum(["nei", "ja"]),
  pumpeTilKumme: z.enum(["nei", "ja"]),
  tilleggsring: z.enum(RING_OPTIONS),
  tilleggsringAntall: z.number().int().min(0).max(20),
  etterpolleringskum: z.enum(SIZE_OPTIONS),
  etterpolleringPlus: z.enum(SIZE_OPTIONS),
  uvLampe: z.enum(SIZE_OPTIONS),
  serviceKjoring: z.enum(["none", "innen50", "over50"]),
  serviceBesok: z.number().int().min(0).max(12),
  aluminiumFatLiter: z.number().min(0).max(10_000),
  offerComments: z.string().max(2000).optional(),
}).superRefine((data, ctx) => {
  const model = BIOCLEANER_MODELS.find((item) => item.id === data.biocleanerModel);
  if (!model) {
    ctx.addIssue({ code: "custom", path: ["biocleanerModel"], message: "Ukjent modell" });
    return;
  }
  if (data.biocleanerType === "optima" && model.optimaPrice == null) {
    ctx.addIssue({ code: "custom", path: ["biocleanerType"], message: "Optima utgår for denne modellen" });
  }
  if (data.tilleggsring !== "none") {
    if (!model.rings) {
      ctx.addIssue({ code: "custom", path: ["tilleggsring"], message: "Tilleggsringer finnes ikke for denne modellen" });
    }
    if (data.tilleggsringAntall < 1) {
      ctx.addIssue({ code: "custom", path: ["tilleggsringAntall"], message: "Oppgi antall ringer" });
    }
  }
  if (data.serviceKjoring !== "none" && data.serviceBesok < 1) {
    ctx.addIssue({ code: "custom", path: ["serviceBesok"], message: "Oppgi antall servicebesøk" });
  }
});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;

export type QuoteLine = { label: string; amount: number };

export type StoredQuote = {
  version: 1;
  customer: {
    name: string;
    address: string;
    streetName: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    municipality: string;
    email: string;
    phone: string;
    numberOfHomes: string;
  };
  modelId: string;
  modelName: string;
  typeId: string;
  typeName: string;
  lines: QuoteLine[];
  sum: number;
  mva: number;
  total: number;
  tilTotal: number;
  serviceAnnual: number | null;
  info: string[];
  comments: string;
  priceListDate: string;
  validDays: number;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatKr(value: number) {
  const rounded = roundMoney(value);
  const hasCents = Math.abs(rounded - Math.trunc(rounded)) > 0.001;
  const formatted = rounded.toLocaleString("nb-NO", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return hasCents ? `kr ${formatted}` : `kr ${formatted},-`;
}

export function biocleanerPrice(modelId: string, typeId: string) {
  const model = BIOCLEANER_MODELS.find((item) => item.id === modelId);
  if (!model) return 0;
  if (typeId === "optima") return model.optimaPrice ?? 0;
  if (typeId === "comfort") return model.comfortPrice ?? 0;
  if (typeId === "exclusive") return (model.comfortPrice ?? 0) + (model.exclusiveTillegg ?? 0);
  return 0;
}

function namedPrice<T extends { id: string; name: string; price: number }>(
  options: readonly T[],
  id: string,
) {
  return options.find((option) => option.id === id) ?? null;
}

export function buildStoredQuote(input: QuoteFormData): StoredQuote {
  const model = BIOCLEANER_MODELS.find((item) => item.id === input.biocleanerModel);
  const type = BIOCLEANER_TYPES.find((item) => item.id === input.biocleanerType);
  const styreskap = STYRESKAP_OPTIONS.find((item) => item.id === input.styreskapSize);
  const region = FRAKT_REGIONS.find((item) => item.id === input.fraktRegion);
  if (!model || !type || !styreskap || !region) {
    throw new Error("Ugyldig tilbud");
  }
  if (input.biocleanerType === "optima" && model.optimaPrice == null) {
    throw new Error("Optima utgår for denne modellen");
  }

  const lines: QuoteLine[] = [];
  const add = (label: string, amount: number) => {
    lines.push({ label, amount: roundMoney(amount) });
  };

  const plantPrice = biocleanerPrice(model.id, type.id);
  add(`Biocleaner ${model.name}, ${type.name}`, plantPrice);
  add(`Styreskap ${styreskap.name}`, styreskap.defaultPrice);
  if (input.utehus === "ja") add("Utehus til styring", UTEHUS_PRICE);
  if (input.pumpekumme === "ja") add("Pumpekumme komplett", OTHER_PRICES.pumpekumme);
  if (input.airPumpe === "60") add("Air-pumpe 60", OTHER_PRICES.air60);
  if (input.airPumpe === "80") add("Air-pumpe 80", OTHER_PRICES.air80);
  if (input.airPumpe === "120") add("Air-pumpe 120", OTHER_PRICES.air120);
  if (input.pumpeKjemi === "ja") add("Pumpe kjemi", OTHER_PRICES.pumpeKjemi);
  if (input.pumpeTilKumme === "ja") add("Pumpe til kumme", OTHER_PRICES.pumpeTilKumme);

  if (input.tilleggsring !== "none") {
    const ringPrice = model.rings?.[input.tilleggsring];
    if (ringPrice == null) throw new Error("Tilleggsringer finnes ikke for denne modellen");
    add(`Tilleggsring ${input.tilleggsring} cm x ${input.tilleggsringAntall}`, ringPrice * input.tilleggsringAntall);
  }

  const kum = namedPrice(ETTERPOLLERINGSKUM, input.etterpolleringskum);
  if (kum) add(`Etterpolleringskum ${kum.name}`, kum.price);
  const plus = namedPrice(ETTERPOLLERING_PLUS, input.etterpolleringPlus);
  if (plus) add(`Etterpollering + ${plus.name}`, plus.price);
  const uv = namedPrice(UV_LAMPE, input.uvLampe);
  if (uv) add(`UV-lampe ${uv.name}`, uv.price);

  add("Søknad om utslipp", DEFAULT_PRICES.soknadUtslipp);
  add("Søknad om dispensasjon", DEFAULT_PRICES.soknadDispensasjon);
  add("Innregulering/oppstart/montering", DEFAULT_PRICES.innregulering);
  add("Graving med singel", input.gravingPrice);
  add(`Frakt (${region.label})`, input.fraktPrice);

  if (input.serviceKjoring !== "none") {
    const perVisit = input.serviceKjoring === "innen50" ? OTHER_PRICES.serviceInnen50 : OTHER_PRICES.serviceOver50;
    const distance = input.serviceKjoring === "innen50" ? "inntil 50 km" : "over 50 km";
    add(`Kjøring service, ${distance} x ${input.serviceBesok} besøk`, perVisit * input.serviceBesok);
  }
  if (input.aluminiumFatLiter > 0) {
    add(`Aluminiumsfat ${input.aluminiumFatLiter} liter`, input.aluminiumFatLiter * OTHER_PRICES.aluminiumFatPerLiter);
  }

  const sum = roundMoney(lines.reduce((total, line) => total + line.amount, 0));
  const mva = roundMoney(sum * 0.25);
  const total = roundMoney(sum + mva);
  const info = [
    "Enhetsprisene er eks. mva og følger Biocleaner-prislisten fra 01.01.2025. Basic utgår.",
    "Årlig servicekostnad fordeles på to servicebesøk og er ikke med i totalprisen.",
  ];
  if (input.serviceKjoring !== "none") {
    info.push("Fergekostnader ved service kommer i tillegg.");
  }
  if (model.group === "large") {
    info.push("For anlegg over 50 PE beregnes frakt, installasjon og service i hvert enkelt tilfelle.");
  }
  info.push("Offentlige saksbehandlingsgebyrer faktureres fra kommunen til kunden.");

  return {
    version: 1,
    customer: {
      name: input.customerName,
      address: input.customerAddress,
      streetName: input.streetName || "",
      houseNumber: input.houseNumber || "",
      postalCode: input.postalCode,
      city: input.city,
      municipality: input.municipality || "",
      email: input.customerEmail,
      phone: input.customerPhone,
      numberOfHomes: input.numberOfHomes,
    },
    modelId: model.id,
    modelName: model.name,
    typeId: type.id,
    typeName: type.name,
    lines,
    sum,
    mva,
    total,
    tilTotal: roundMoney(total + CONTINGENCY_AMOUNT),
    serviceAnnual: model.serviceAnnual,
    info,
    comments: input.offerComments?.trim() || "",
    priceListDate: PRICE_LIST_DATE,
    validDays: QUOTE_VALID_DAYS,
  };
}

export function previewQuote(input: Partial<QuoteFormData>): StoredQuote | null {
  if (!input.biocleanerModel) return null;
  const parsed = quoteFormSchema.safeParse({
    customerName: "Forhåndsvisning",
    customerAddress: "Ukjent adresse 1",
    postalCode: "0000",
    city: "Ukjent",
    customerEmail: "forhandsvisning@example.com",
    customerPhone: "00000000",
    biocleanerModel: input.biocleanerModel,
    biocleanerType: input.biocleanerType || "comfort",
    numberOfHomes: input.numberOfHomes || "1",
    styreskapSize: input.styreskapSize || "small",
    utehus: input.utehus || "nei",
    gravingPrice: input.gravingPrice ?? DEFAULT_PRICES.graving,
    fraktPrice: Number.isFinite(input.fraktPrice) ? input.fraktPrice : DEFAULT_PRICES.frakt,
    fraktRegion: input.fraktRegion || FRAKT_REGIONS[0].id,
    pumpekumme: input.pumpekumme || "nei",
    airPumpe: input.airPumpe || "none",
    pumpeKjemi: input.pumpeKjemi || "nei",
    pumpeTilKumme: input.pumpeTilKumme || "nei",
    tilleggsring: input.tilleggsring || "none",
    tilleggsringAntall: input.tilleggsringAntall ?? 1,
    etterpolleringskum: input.etterpolleringskum || "none",
    etterpolleringPlus: input.etterpolleringPlus || "none",
    uvLampe: input.uvLampe || "none",
    serviceKjoring: input.serviceKjoring || "none",
    serviceBesok: input.serviceBesok ?? 2,
    aluminiumFatLiter: input.aluminiumFatLiter ?? 0,
    offerComments: input.offerComments,
  });
  if (!parsed.success) return null;
  return buildStoredQuote(parsed.data);
}

export function quoteNotes(quote: StoredQuote) {
  return [
    "Tilbud sendt til administrator for godkjenning og utskrift i PDF.",
    `${quote.modelName}, ${quote.typeName}`,
    `Antall boliger/hytter: ${quote.customer.numberOfHomes}`,
    ...quote.lines.map((line) => `${line.label}: ${formatKr(line.amount)}`),
    `Sum eks. mva: ${formatKr(quote.sum)}`,
    `Mva: ${formatKr(quote.mva)}`,
    `FRA-total: ${formatKr(quote.total)}`,
    `TIL-total inkl. avsetning: ${formatKr(quote.tilTotal)}`,
    quote.serviceAnnual != null ? `Årlig servicekostnad (ikke i total): ${formatKr(quote.serviceAnnual)}` : "",
    quote.comments ? `Kommentar: ${quote.comments}` : "",
  ].filter(Boolean).join("\n");
}

export function parseStoredQuote(payload: string | null | undefined): StoredQuote | null {
  if (!payload) return null;
  try {
    const data = JSON.parse(payload) as StoredQuote;
    if (data?.version !== 1 || !Array.isArray(data.lines)) return null;
    return data;
  } catch {
    return null;
  }
}
