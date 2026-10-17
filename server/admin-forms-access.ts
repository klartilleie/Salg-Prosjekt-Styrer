import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    adminFormsAccess?: boolean;
  }
}

/** Fixed inbox for new quote form notifications. */
export const ADMIN_NOTIFY_ADDRESS = "post@representanten.no";

/**
 * Secret used in the e-mailed admin link. Prefer ADMIN_FORMS_ACCESS_KEY;
 * otherwise derive a stable key from SESSION_SECRET so the URL is not guessable.
 */
export function getAdminFormsAccessKey(): string {
  const configured = process.env.ADMIN_FORMS_ACCESS_KEY?.trim();
  if (configured) return configured;
  const secret = process.env.SESSION_SECRET || "dev-session-secret";
  return createHmac("sha256", secret).update("admin-forms-access-v1").digest("hex").slice(0, 32);
}

export function adminFormsAccessUrl(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/app/admin/godkjenninger?k=${encodeURIComponent(getAdminFormsAccessKey())}`;
}

export function isValidAdminFormsAccessKey(candidate: string | undefined | null): boolean {
  const key = candidate?.trim();
  if (!key) return false;
  const expected = getAdminFormsAccessKey();
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireAdminFormsAccess(req: Request, res: Response, next: NextFunction) {
  if (req.session.adminFormsAccess === true) {
    return next();
  }
  return res.status(403).send("Åpne siden via lenken i e-posten til administrator");
}
