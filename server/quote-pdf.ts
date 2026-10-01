import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatKr, type StoredQuote } from "@shared/biocleaner-offer";

const STATUS_LABEL: Record<string, string> = {
  pending: "Venter på godkjenning",
  approved: "Godkjent",
  rejected: "Avvist",
};

function wrapText(text: string, font: { widthOfTextAtSize: (value: string, size: number) => number }, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines.length ? lines : [""];
}

export async function renderQuotePdf(quote: StoredQuote, status = "pending") {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const contentWidth = pageWidth - margin * 2;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensure = (height: number) => {
    if (y - height >= margin) return;
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const draw = (text: string, size: number, font = regular, color = rgb(0.1, 0.12, 0.16)) => {
    for (const line of wrapText(text, font, size, contentWidth)) {
      ensure(size + 6);
      page.drawText(line, { x: margin, y: y - size, size, font, color });
      y -= size + 4;
    }
  };

  draw("Smart Hjem AS", 11, bold, rgb(0.2, 0.35, 0.28));
  draw("Tilbud på Biocleaner renseanlegg", 20, bold);
  y -= 4;
  draw(`Prisliste fra ${quote.priceListDate}. Gyldig i ${quote.validDays} dager. Status: ${STATUS_LABEL[status] || status}`, 10, regular, rgb(0.3, 0.33, 0.38));
  y -= 8;

  draw("Kunde", 12, bold);
  draw(quote.customer.name, 11);
  draw(quote.customer.address, 11);
  draw(`${quote.customer.postalCode} ${quote.customer.city}${quote.customer.municipality ? `, ${quote.customer.municipality}` : ""}`, 11);
  draw(`${quote.customer.email} · ${quote.customer.phone}`, 11);
  draw(`Antall boliger/hytter: ${quote.customer.numberOfHomes}`, 11);
  y -= 8;

  draw("Prisdetaljer eks. mva", 12, bold);
  y -= 2;
  for (const line of quote.lines) {
    ensure(16);
    const amount = formatKr(line.amount);
    const amountWidth = regular.widthOfTextAtSize(amount, 10);
    const labelWidth = contentWidth - amountWidth - 12;
    const label = wrapText(line.label, regular, 10, labelWidth)[0];
    page.drawText(label, { x: margin, y: y - 10, size: 10, font: regular, color: rgb(0.1, 0.12, 0.16) });
    page.drawText(amount, { x: pageWidth - margin - amountWidth, y: y - 10, size: 10, font: regular, color: rgb(0.1, 0.12, 0.16) });
    y -= 16;
  }

  y -= 4;
  const totals = [
    ["Sum eks. mva", formatKr(quote.sum)],
    ["Mva (25 %)", formatKr(quote.mva)],
    ["FRA-total inkl. mva", formatKr(quote.total)],
    ["TIL-total inkl. avsetning", formatKr(quote.tilTotal)],
  ] as const;
  for (const [label, amount] of totals) {
    ensure(16);
    const amountWidth = bold.widthOfTextAtSize(amount, 11);
    page.drawText(label, { x: margin, y: y - 11, size: 11, font: bold });
    page.drawText(amount, { x: pageWidth - margin - amountWidth, y: y - 11, size: 11, font: bold });
    y -= 16;
  }
  y -= 6;
  draw("TIL-total inkluderer en avsetning på inntil 20 000 kr for uforutsette forhold som sprengning, kiling av fjell, uventede masser eller ekstra sikring. Beløpet faktureres bare dersom slike forhold oppstår, og etter avtale med kunden.", 9, regular, rgb(0.3, 0.33, 0.38));
  if (quote.serviceAnnual != null) {
    y -= 4;
    draw(`Årlig servicekostnad for ${quote.modelName}: ${formatKr(quote.serviceAnnual)}. Dette er ikke inkludert i totalprisen.`, 10);
  }
  y -= 6;
  for (const note of quote.info) draw(note, 9, regular, rgb(0.3, 0.33, 0.38));
  if (quote.comments) {
    y -= 6;
    draw("Kommentarer", 12, bold);
    draw(quote.comments, 10);
  }
  y -= 8;
  draw("Vilkår", 12, bold);
  draw("Tilbudet forutsetter godkjent utslippstillatelse fra kommunen basert på prosjektert plassering.", 9, regular, rgb(0.3, 0.33, 0.38));
  draw("Endelige vilkår, garantier og fremdriftsplan står i utførelseskontrakten.", 9, regular, rgb(0.3, 0.33, 0.38));
  y -= 10;
  draw("Skjemaet er sendt til administrator for godkjenning og utskrift. Administrator er varslet på e-post.", 9, bold);

  return pdf.save();
}
