import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertCustomerSchema, insertPayoutSchema, insertUserSchema } from "@shared/schema";
import multer from "multer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { z } from "zod";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Ikke autorisert");
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Ikke autorisert");
  }
  if (req.user?.role !== "admin") {
    return res.status(403).send("Krever administratortilgang");
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const preferredUploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
  let uploadDir = preferredUploadDir;
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (error) {
    uploadDir = path.resolve("/tmp/uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    console.warn(`Upload directory ${preferredUploadDir} is not writable. Using ${uploadDir}.`);
  }
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).slice(0, 16).replace(/[^.a-zA-Z0-9]/g, "");
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomersByUserId(req.user!.id);
      res.json(customers);
    } catch (error) {
      res.status(500).send("Kunne ikke hente kunder");
    }
  });

  const quoteSchema = z.object({
    firstName: z.string().trim().min(2),
    lastName: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z.string().trim().min(8),
    address: z.string().trim().min(5),
    postalCode: z.string().regex(/^\d{4}$/),
    city: z.string().trim().min(2),
    municipality: z.string().trim().optional(),
    notes: z.string().trim().min(2).max(2000),
  });

  async function websiteInboxUserId() {
    const username = "nettside";
    const existing = await storage.getUserByUsername(username);
    if (existing) return existing.id;
    const user = await storage.createUser({
      username,
      password: await hashPassword(randomUUID()),
      fullName: "Nettside",
      email: "nettside@lokal",
      role: "user",
    });
    await storage.updateUser(user.id, { isActive: false });
    return user.id;
  }

  app.post("/api/quotes", async (req, res) => {
    try {
      const validated = quoteSchema.parse(req.body);
      const userId = await websiteInboxUserId();
      await storage.createCustomer({
        ...validated,
        municipality: validated.municipality || null,
        userId,
        source: "web",
        status: "pending",
      } as any);
      res.status(201).json({ ok: true });
    } catch (error: any) {
      res.status(400).send(error.message || "Ugyldig tilbud");
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validated = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer({
        ...validated,
        userId: req.user!.id,
      } as any);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).send(error.message || "Ugyldig data");
    }
  });

  app.get("/api/payouts", requireAuth, async (req, res) => {
    try {
      const payouts = await storage.getPayoutsByUserId(req.user!.id);
      res.json(payouts);
    } catch (error) {
      res.status(500).send("Kunne ikke hente utbetalinger");
    }
  });

  app.post("/api/payouts", requireAuth, async (req, res) => {
    try {
      const validated = insertPayoutSchema.parse(req.body);
      const payout = await storage.createPayout({
        ...validated,
        userId: req.user!.id,
      } as any);
      res.status(201).json(payout);
    } catch (error: any) {
      res.status(400).send(error.message || "Ugyldig data");
    }
  });

  app.get("/api/address-search", async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query || query.length < 3) {
        return res.json({ adresser: [] });
      }
      
      const response = await fetch(
        `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(query)}&treffPerSide=10`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).send("Kunne ikke søke adresser");
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).send("Kunne ikke hente brukere");
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(validated.username);
      if (existing) {
        return res.status(400).send("Brukernavn er allerede i bruk");
      }
      const user = await storage.createUser({
        ...validated,
        password: await hashPassword(validated.password),
      });
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).send(error.message || "Ugyldig data");
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).send("Bruker ikke funnet");
      }
      res.json(user);
    } catch (error) {
      res.status(500).send("Kunne ikke oppdatere bruker");
    }
  });

  app.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).send("Kunne ikke hente kunder");
    }
  });

  app.post("/api/admin/customers/:id/approve", requireAdmin, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).send("Kunde ikke funnet");
      }

      // Fixed sale amount of 5000 kr and 100 points per approved sale
      const FIXED_COMMISSION = "5000";
      const FIXED_POINTS = 100;
      
      const updatedCustomer = await storage.updateCustomer(req.params.id, {
        status: "approved",
        commissionAmount: FIXED_COMMISSION,
        pointsAwarded: FIXED_POINTS,
        approvedAt: new Date(),
        approvedBy: req.user!.id,
      });

      const user = await storage.getUser(customer.userId);
      if (user) {
        const newPoints = (user.points || 0) + FIXED_POINTS;
        const newEarnings = parseFloat(user.earnings?.toString() || "0") + parseFloat(FIXED_COMMISSION);
        await storage.updateUser(customer.userId, {
          points: newPoints,
          earnings: newEarnings.toString(),
        });
      }

      res.json(updatedCustomer);
    } catch (error) {
      res.status(500).send("Kunne ikke godkjenne salg");
    }
  });

  app.post("/api/admin/customers/:id/reject", requireAdmin, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, {
        status: "rejected",
        approvedAt: new Date(),
        approvedBy: req.user!.id,
      });
      if (!customer) {
        return res.status(404).send("Kunde ikke funnet");
      }
      res.json(customer);
    } catch (error) {
      res.status(500).send("Kunne ikke avvise salg");
    }
  });

  app.get("/api/admin/payouts", requireAdmin, async (req, res) => {
    try {
      const payouts = await storage.getAllPayouts();
      res.json(payouts);
    } catch (error) {
      res.status(500).send("Kunne ikke hente utbetalinger");
    }
  });

  app.post("/api/admin/payouts/:id/complete", requireAdmin, async (req, res) => {
    try {
      const { paidAmount } = req.body;
      const payout = await storage.updatePayout(req.params.id, {
        status: "completed",
        paidAmount: paidAmount,
        processedAt: new Date(),
        processedBy: req.user!.id,
      });
      if (!payout) {
        return res.status(404).send("Utbetaling ikke funnet");
      }
      res.json(payout);
    } catch (error) {
      res.status(500).send("Kunne ikke fullføre utbetaling");
    }
  });

  app.post("/api/admin/payouts/:id/reject", requireAdmin, async (req, res) => {
    try {
      const payout = await storage.updatePayout(req.params.id, {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.user!.id,
      });
      if (!payout) {
        return res.status(404).send("Utbetaling ikke funnet");
      }
      res.json(payout);
    } catch (error) {
      res.status(500).send("Kunne ikke avvise utbetaling");
    }
  });

  // Profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).send("Bruker ikke funnet");
      }
      const { password, ...profile } = user;
      res.json(profile);
    } catch (error) {
      res.status(500).send("Kunne ikke hente profil");
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const { fullName, email, phone, bankAccountNumber } = req.body;
      const user = await storage.updateUser(req.user!.id, {
        fullName,
        email,
        phone,
        bankAccountNumber,
      });
      if (!user) {
        return res.status(404).send("Bruker ikke funnet");
      }
      const { password, ...profile } = user;
      res.json(profile);
    } catch (error) {
      res.status(500).send("Kunne ikke oppdatere profil");
    }
  });

  // Attachment routes
  app.get("/api/customers/:id/attachments", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).send("Kunde ikke funnet");
      }
      if (customer.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).send("Ingen tilgang");
      }
      const attachments = await storage.getAttachmentsByCustomerId(req.params.id);
      res.json(attachments);
    } catch (error) {
      res.status(500).send("Kunne ikke hente vedlegg");
    }
  });

  app.post("/api/customers/:id/attachments", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const customerId = String(req.params.id);
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).send("Kunde ikke funnet");
      }
      if (customer.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).send("Ingen tilgang");
      }
      if (!req.file) {
        return res.status(400).send("Ingen fil ble sendt");
      }
      const attachment = await storage.createAttachment({
        customerId,
        fileName: req.file.originalname,
        fileUrl: `/api/files/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
      res.status(201).json(attachment);
    } catch (error: any) {
      res.status(500).send("Kunne ikke lagre vedlegg");
    }
  });

  app.get("/api/files/:filename", requireAuth, async (req, res) => {
    try {
      const filename = path.basename(String(req.params.filename));
      const fileUrl = `/api/files/${filename}`;
      const attachment = await storage.getAttachmentByFileUrl(fileUrl);
      if (!attachment) {
        return res.status(404).send("Vedlegg ikke funnet");
      }
      const customer = await storage.getCustomer(attachment.customerId);
      if (!customer || (customer.userId !== req.user!.id && req.user!.role !== "admin")) {
        return res.status(403).send("Ingen tilgang");
      }
      const filePath = path.resolve(uploadDir, filename);
      if (!filePath.startsWith(path.resolve(uploadDir)) || !fs.existsSync(filePath)) {
        return res.status(404).send("Filen finnes ikke");
      }
      res.download(filePath, attachment.fileName);
    } catch {
      res.status(500).send("Kunne ikke hente filen");
    }
  });

  app.delete("/api/attachments/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteAttachment(String(req.params.id));
      if (!deleted) {
        return res.status(404).send("Vedlegg ikke funnet");
      }
      const filename = path.basename(deleted.fileUrl);
      const filePath = path.resolve(uploadDir, filename);
      if (filePath.startsWith(path.resolve(uploadDir)) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).send("Kunne ikke slette vedlegg");
    }
  });

  return httpServer;
}
