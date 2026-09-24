export const BIOCLEANER_MODELS = [
  { id: "bc6", name: "BC 6 (1-6 PE)", pe: 6, volume: "3,0 m³", optimaPrice: 61692, comfortPrice: 66692, exclusiveTillegg: 12274 },
  { id: "bc10", name: "BC 10 (1-10 PE)", pe: 10, volume: "5,0 m³", optimaPrice: 77789, comfortPrice: 83289, exclusiveTillegg: 12586 },
  { id: "bc12", name: "BC 12 (1-12 PE)", pe: 12, volume: "6,0 m³", optimaPrice: 90454, comfortPrice: 96854, exclusiveTillegg: 13654 },
  { id: "bc16", name: "BC 16 (1-16 PE)", pe: 16, volume: "8,0 m³", optimaPrice: null, comfortPrice: 120818, exclusiveTillegg: 13654 },
  { id: "bc20", name: "BC 20 (1-20 PE)", pe: 20, volume: "10,0 m³", optimaPrice: null, comfortPrice: 153219, exclusiveTillegg: 13654 },
  { id: "bc25", name: "BC 25 (1-25 PE)", pe: 25, volume: "12,5 m³", optimaPrice: null, comfortPrice: 186688, exclusiveTillegg: 15456 },
  { id: "bc30", name: "BC 30 (1-30 PE)", pe: 30, volume: "15,0 m³", optimaPrice: null, comfortPrice: 198643, exclusiveTillegg: 16836 },
  { id: "bc50", name: "BC 50 (1-50 PE)", pe: 50, volume: "25,0 m³", optimaPrice: null, comfortPrice: 265246, exclusiveTillegg: 20286 },
] as const;

export const BIOCLEANER_TYPES = [
  { id: "optima", name: "Optima", description: "Standard-løsning" },
  { id: "comfort", name: "Comfort", description: "Med fjernstyring" },
  { id: "exclusive", name: "Exclusive", description: "Med tertiærfilter" },
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

export const DEFAULT_PRICES = {
  soknadUtslipp: 12500,
  soknadDispensasjon: 7500,
  innregulering: 16900,
  graving: 25000,
  frakt: 6200,
} as const;

export function biocleanerPrice(modelId: string, typeId: string) {
  const model = BIOCLEANER_MODELS.find((item) => item.id === modelId);
  if (!model) return 0;
  if (typeId === "optima") return model.optimaPrice || 0;
  if (typeId === "comfort") return model.comfortPrice || 0;
  if (typeId === "exclusive") return (model.comfortPrice || 0) + (model.exclusiveTillegg || 0);
  return 0;
}
