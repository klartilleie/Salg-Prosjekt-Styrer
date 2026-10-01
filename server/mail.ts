import nodemailer from "nodemailer";
import { formatKr, type StoredQuote } from "@shared/biocleaner-offer";
import { storage } from "./storage";

export async function notifyAdminsOfQuote(input: {
  quote: StoredQuote;
  pdf: Uint8Array;
  sellerName?: string;
}) {
  const admins = (await storage.getAllUsers()).filter((user) => user.role === "admin" && user.isActive);
  const recipients: string[] = [];
  for (const email of [...admins.map((user) => user.email), process.env.ADMIN_NOTIFY_EMAIL, process.env.ADMIN_EMAIL]) {
    const trimmed = email?.trim();
    if (trimmed && trimmed.includes("@") && !recipients.includes(trimmed)) recipients.push(trimmed);
  }

  if (recipients.length === 0) {
    return { sent: false, reason: "Ingen administrator har en gyldig e-postadresse" };
  }

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
  const approvalUrl = appUrl ? `${appUrl}/app/admin/godkjenninger` : "";
  const text = [
    "Et nytt Biocleaner-tilbud er sendt inn og venter på godkjenning og utskrift.",
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
    "PDF-tilbudet er vedlagt og kan skrives ut.",
    approvalUrl ? `Godkjenninger: ${approvalUrl}` : "",
  ].filter(Boolean).join("\n");

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@localhost",
      to: recipients,
      subject: `Nytt tilbud til godkjenning: ${quote.customer.name}`,
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
