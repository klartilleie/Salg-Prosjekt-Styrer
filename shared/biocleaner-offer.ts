import { z } from "zod";

/** Prisliste gyldig fra denne datoen. Utstyr og gebyrer er justert fra 2025-listen og avrundet til hele kroner. */
export const PRICE_LIST_DATE = "01.10.2026";
export const PRICE_INCREASE_FACTOR = 1.13;
export const QUOTE_VALID_DAYS = 30;
export const CONTINGENCY_AMOUNT = 20000;

/** Månedlig service (inkl. mva) er fast og følger ikke prisøkningen. */
export const SERVICE_MONTHLY_BC6 = 799;
export const SERVICE_MONTHLY_STEP = 100;

/** Inkluderte servicebesøk ved kjøring «ink.»; ekstra besøk prises separat. */
export const SERVICE_INCLUDED_VISITS = 2;
export const SERVICE_EXTRA_VISIT_PRICE = 1500;

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Juster prislistepris med 13 % og avrund til nærmeste hele krone. Ingen øre. */
function listPrice(base2025: number): number;
function listPrice(base2025: null): null;
function listPrice(base2025: number | null): number | null;
function listPrice(base2025: number | null): number | null {
  if (base2025 == null) return null;
  const ore = Math.round(base2025 * 100);
  const percent = Math.round(PRICE_INCREASE_FACTOR * 100);
  return Math.round((ore * percent) / 10000);
}

const BASE_MODELS = [
  { id: "bc6", name: "BC 6 (1-6 PE)", pe: 6, volume: "3,0 m³", group: "standard", optimaPrice: 78349, comfortPrice: 85790, exclusiveTillegg: 12274, rings: { "60": 5934, "80": 7590, "100": 10212 } },
  { id: "bc10", name: "BC 10 (1-10 PE)", pe: 10, volume: "5,0 m³", group: "standard", optimaPrice: 98792, comfortPrice: 104890, exclusiveTillegg: 12586, rings: { "60": 6486, "80": 7728, "100": 11592 } },
  { id: "bc12", name: "BC 12 (1-12 PE)", pe: 12, volume: "6,0 m³", group: "standard", optimaPrice: 115385, comfortPrice: 123675, exclusiveTillegg: 13654, rings: { "60": 7728, "80": 9246, "100": 13248 } },
  { id: "bc16", name: "BC 16 (1-16 PE)", pe: 16, volume: "8,0 m³", group: "standard", optimaPrice: null, comfortPrice: 151671, exclusiveTillegg: 13654, rings: { "60": 9936, "80": 12282, "100": 16698 } },
  { id: "bc20", name: "BC 20 (1-20 PE)", pe: 20, volume: "10,0 m³", group: "standard", optimaPrice: null, comfortPrice: 181439, exclusiveTillegg: 13654, rings: { "60": 12351, "80": 15456, "100": 18906 } },
  { id: "bc25", name: "BC 25 (1-25 PE)", pe: 25, volume: "12,5 m³", group: "standard", optimaPrice: null, comfortPrice: 223543, exclusiveTillegg: 15456, rings: { "60": 12696, "80": 16008, "100": 19872 } },
  { id: "bc30", name: "BC 30 (1-30 PE)", pe: 30, volume: "15,0 m³", group: "standard", optimaPrice: null, comfortPrice: 254672, exclusiveTillegg: 16836, rings: null },
  { id: "bc40", name: "BC 40 (1-40 PE)", pe: 40, volume: null, group: "standard", optimaPrice: null, comfortPrice: 269935, exclusiveTillegg: 18680, rings: null },
  { id: "bc50", name: "BC 50 (1-50 PE)", pe: 50, volume: "25,0 m³", group: "standard", optimaPrice: null, comfortPrice: 283542, exclusiveTillegg: 20286, rings: null },
  { id: "bc60", name: "BC 60 (over 50 PE)", pe: 60, volume: null, group: "large", optimaPrice: null, comfortPrice: 367980, exclusiveTillegg: 22689, rings: null },
  { id: "bc75", name: "BC 75 (over 50 PE)", pe: 75, volume: null, group: "large", optimaPrice: null, comfortPrice: 397750, exclusiveTillegg: 42204, rings: null },
  { id: "bc100", name: "BC 100 (over 50 PE)", pe: 100, volume: null, group: "large", optimaPrice: null, comfortPrice: 439671, exclusiveTillegg: 60781, rings: null },
  { id: "bc150", name: "BC 150 (over 50 PE)", pe: 150, volume: null, group: "large", optimaPrice: null, comfortPrice: 496195, exclusiveTillegg: 73366, rings: null },
  { id: "bc200", name: "BC 200 (over 50 PE)", pe: 200, volume: null, group: "large", optimaPrice: null, comfortPrice: 568577, exclusiveTillegg: 84068, rings: null },
  { id: "bc250", name: "BC 250 (over 50 PE)", pe: 250, volume: null, group: "large", optimaPrice: null, comfortPrice: 657549, exclusiveTillegg: 97223, rings: null },
  { id: "bc300", name: "BC 300 (over 50 PE)", pe: 300, volume: null, group: "large", optimaPrice: null, comfortPrice: 730971, exclusiveTillegg: 108079, rings: null },
  { id: "bc400", name: "BC 400 (over 50 PE)", pe: 400, volume: null, group: "large", optimaPrice: null, comfortPrice: 938681, exclusiveTillegg: 138790, rings: null },
  { id: "bc500", name: "BC 500 (over 50 PE)", pe: 500, volume: null, group: "large", optimaPrice: null, comfortPrice: 1056728, exclusiveTillegg: 156244, rings: null },
] as const;

export const BIOCLEANER_MODELS = BASE_MODELS.map((model) => ({
  ...model,
  optimaPrice: listPrice(model.optimaPrice),
  comfortPrice: listPrice(model.comfortPrice),
  exclusiveTillegg: listPrice(model.exclusiveTillegg),
  rings: model.rings
    ? {
        "60": listPrice(model.rings["60"]),
        "80": listPrice(model.rings["80"]),
        "100": listPrice(model.rings["100"]),
      }
    : null,
}));

export type BiocleanerModel = (typeof BIOCLEANER_MODELS)[number];

export function serviceMonthlyInclVat(modelId: string) {
  const index = BIOCLEANER_MODELS.findIndex((model) => model.id === modelId);
  if (index < 0) return null;
  return SERVICE_MONTHLY_BC6 + index * SERVICE_MONTHLY_STEP;
}

export const BIOCLEANER_TYPES = [
  { id: "optima", name: "Optima", description: "Standard-løsning" },
  { id: "comfort", name: "Comfort", description: "Med fjernstyring" },
  { id: "exclusive", name: "Exclusive", description: "Comfort med tertiærfilter" },
] as const;

export const STYRESKAP_OPTIONS = [
  { id: "small", name: "Small", defaultPrice: listPrice(6944) },
  { id: "medium", name: "Medium", defaultPrice: listPrice(8960) },
  { id: "large", name: "Large", defaultPrice: listPrice(15232) },
] as const;

export const UTEHUS_PRICE = listPrice(10000);

const GRAVING_BASE = [25000, 35000, 45000, 55000, 65000, 75000, 85000, 95000, 105000] as const;

/** Graving med singel følger ikke prisøkningen. */
export const GRAVING_OPTIONS = GRAVING_BASE.map((value) => ({
  value,
  label: `${value.toLocaleString("nb-NO")} kr`,
}));

export const OTHER_PRICES = {
  pumpekumme: listPrice(50508),
  air60: listPrice(4761),
  air80: listPrice(6762),
  air120: listPrice(9108),
  pumpeKjemi: listPrice(5796),
  pumpeTilKumme: listPrice(25254),
  serviceInnen50: listPrice(710),
  serviceOver50: listPrice(850),
  aluminiumFatPerLiter: listPrice(25.5),
} as const;

export const ETTERPOLLERINGSKUM = [
  { id: "small", name: "Small (6-10)", price: listPrice(8064) },
  { id: "medium", name: "Medium (10-16)", price: listPrice(10080) },
  { id: "large", name: "Large (over 16)", price: listPrice(17203.2) },
] as const;

export const ETTERPOLLERING_PLUS = [
  { id: "small", name: "Small", price: listPrice(11558.4) },
  { id: "medium", name: "Medium", price: listPrice(13708.8) },
  { id: "large", name: "Large", price: listPrice(21907.2) },
] as const;

export const UV_LAMPE = [
  { id: "small", name: "Small", price: listPrice(3840) },
  { id: "medium", name: "Medium", price: listPrice(5400) },
  { id: "large", name: "Large", price: listPrice(8640) },
] as const;

export const DEFAULT_PRICES = {
  soknadUtslipp: listPrice(12500),
  soknadDispensasjon: listPrice(7500),
  innregulering: listPrice(16900),
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
  pumpekumme: z.enum(["nei", "ja"]),
  airPumpe: z.enum(["none", "60", "80", "120"]),
  pumpeKjemi: z.enum(["nei", "ja"]),
  pumpeTilKumme: z.enum(["nei", "ja"]),
  tilleggsring: z.enum(RING_OPTIONS),
  tilleggsringAntall: z.number().int().min(0).max(20),
  etterpolleringskum: z.enum(SIZE_OPTIONS),
  etterpolleringPlus: z.enum(SIZE_OPTIONS),
  uvLampe: z.enum(SIZE_OPTIONS),
  serviceKjoring: z.enum(["none", "inkl", "innen50", "over50"]),
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
  if (data.serviceKjoring !== "none" && data.serviceBesok < SERVICE_INCLUDED_VISITS) {
    ctx.addIssue({
      code: "custom",
      path: ["serviceBesok"],
      message: `Antall servicebesøk kan ikke være mindre enn ${SERVICE_INCLUDED_VISITS}`,
    });
  }
});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;

export type QuoteLine = { label: string; amount: number };

export type StoredQuote = {
  version: 1;
  formInput?: QuoteFormData;
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
  serviceMonthlyInclVat?: number | null;
  serviceAnnual: number | null;
  info: string[];
  comments: string;
  priceListDate: string;
  validDays: number;
};

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

function serviceKjoringLines(input: QuoteFormData): QuoteLine[] {
  if (input.serviceKjoring === "none") return [];

  const visits = input.serviceBesok;
  if (input.serviceKjoring === "inkl") {
    const extras = Math.max(0, visits - SERVICE_INCLUDED_VISITS);
    if (extras <= 0) {
      return [{ label: `Kjøring service inkludert (${SERVICE_INCLUDED_VISITS} besøk)`, amount: 0 }];
    }
    return [
      {
        label: `Kjøring service, ${extras} ekstra besøk utover ${SERVICE_INCLUDED_VISITS}`,
        amount: Math.round(extras * SERVICE_EXTRA_VISIT_PRICE),
      },
    ];
  }

  const perVisit = input.serviceKjoring === "innen50" ? OTHER_PRICES.serviceInnen50 : OTHER_PRICES.serviceOver50;
  const distance = input.serviceKjoring === "innen50" ? "inntil 50 km" : "over 50 km";
  return [
    {
      label: `Kjøring service, ${distance} x ${visits} besøk`,
      amount: Math.round(perVisit * visits),
    },
  ];
}

export function buildStoredQuote(input: QuoteFormData): StoredQuote {
  const model = BIOCLEANER_MODELS.find((item) => item.id === input.biocleanerModel);
  const type = BIOCLEANER_TYPES.find((item) => item.id === input.biocleanerType);
  const styreskap = STYRESKAP_OPTIONS.find((item) => item.id === input.styreskapSize);
  if (!model || !type || !styreskap) {
    throw new Error("Ugyldig tilbud");
  }
  if (input.biocleanerType === "optima" && model.optimaPrice == null) {
    throw new Error("Optima utgår for denne modellen");
  }

  const lines: QuoteLine[] = [];
  const add = (label: string, amount: number) => {
    lines.push({ label, amount: Math.round(amount) });
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
  add("Frakt", DEFAULT_PRICES.frakt);

  for (const line of serviceKjoringLines(input)) {
    if (line.amount > 0 || input.serviceKjoring === "inkl") {
      lines.push(line);
    }
  }

  if (input.aluminiumFatLiter > 0) {
    add(`Aluminiumsfat ${input.aluminiumFatLiter} liter`, input.aluminiumFatLiter * OTHER_PRICES.aluminiumFatPerLiter);
  }

  const sum = lines.reduce((total, line) => total + line.amount, 0);
  const total = Math.round(sum * 1.25);
  const mva = total - sum;
  const monthlyService = serviceMonthlyInclVat(model.id);
  const info = [
    `Enhetsprisene er eks. mva og følger Biocleaner-prislisten fra ${PRICE_LIST_DATE}. Basic utgår.`,
    "Månedlig servicepris er fast og er ikke justert opp med prislisten.",
  ];
  if (input.serviceKjoring === "inkl") {
    info.push(
      `Kjøring ved service er inkludert for ${SERVICE_INCLUDED_VISITS} besøk. Ekstra besøk: ${formatKr(SERVICE_EXTRA_VISIT_PRICE)} pr besøk.`,
    );
  }
  if (input.serviceKjoring !== "none") {
    info.push("Fergekostnader ved service kommer i tillegg.");
  }
  if (model.group === "large") {
    info.push("For anlegg over 50 PE beregnes installasjon i hvert enkelt tilfelle.");
  }
  info.push("Offentlige saksbehandlingsgebyrer faktureres fra kommunen til kunden.");

  return {
    version: 1,
    formInput: input,
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
    serviceMonthlyInclVat: monthlyService,
    serviceAnnual: monthlyService == null ? null : monthlyService * 12,
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
    serviceBesok: input.serviceBesok ?? SERVICE_INCLUDED_VISITS,
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
