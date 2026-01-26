import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertCustomerSchema, insertPayoutSchema, insertUserSchema } from "@shared/schema";

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

  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomersByUserId(req.user!.id);
      res.json(customers);
    } catch (error) {
      res.status(500).send("Kunne ikke hente kunder");
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
      const payout = await storage.updatePayout(req.params.id, {
        status: "completed",
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

  return httpServer;
}
