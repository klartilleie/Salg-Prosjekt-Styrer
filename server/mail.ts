import nodemailer from "nodemailer";
import { formatKr, type StoredQuote } from "@shared/biocleaner-offer";
import {
  ADMIN_NOTIFY_ADDRESS,
  adminFormsAccessUrl,
} from "./admin-forms-access";

export async function notifyAdminsOfQuote(input: {
  quote: StoredQuote;
  pdf: Uint8Array;
  sellerName?: string;
}) {
  const recipients = [ADMIN_NOTIFY_ADDRESS];

  const host = process.env.SMTP_HOST;
  if (!host) {
    return { sent: false, reason: "E-post er ikke konfigurert (SMTP_HOST mangler)" };
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
      : undefined,
  });

  const { quote } = input;
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  const approvalUrl = appUrl ? adminFormsAccessUrl(appUrl) : "";
  const text = [
    "Et nytt Biocleaner-skjema er lagret i systemet og venter på intern behandling.",
    "Skjemaet er IKKE sendt til kunden.",
    "",
    `Kunde: ${quote.customer.name}`,
    `Adresse: ${quote.customer.address}, ${quote.customer.postalCode} ${quote.customer.city}`,
    `E-post: ${quote.customer.email}`,
    `Telefon: ${quote.customer.phone}`,
    `Anlegg: ${quote.modelName}, ${quote.typeName}`,
    `FRA-total: ${formatKr(quote.total)}`,
    `TIL-total inkl. avsetning: ${formatKr(quote.tilTotal)}`,
    input.sellerName ? `Sendt inn av: ${input.sellerName}` : "Sendt inn fra nettsiden",
    "",
    "PDF for intern bruk er vedlagt.",
    "Admin-siden for innsendte skjema er ikke synlig i menyen.",
    approvalUrl
      ? `Åpne skjemaet her (bruk kun denne lenken): ${approvalUrl}`
      : "APP_URL mangler, så admin-lenke kunne ikke legges ved.",
  ].filter(Boolean).join("\n");

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@localhost",
      to: recipients,
      subject: `Nytt skjema til intern behandling: ${quote.customer.name}`,
      text,
      attachments: [
        {
          filename: "tilbud.pdf",
          content: Buffer.from(input.pdf),
          contentType: "application/pdf",
        },
      ],
    });
    return { sent: true as const };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Ukjent feil ved sending av e-post";
    console.error("Kunne ikke varsle administrator på e-post:", reason);
    return { sent: false, reason };
  }
}
