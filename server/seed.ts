import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedAdminUser() {
  // Seed default dev admin
  const adminUsername = "admin";
  const existingAdmin = await storage.getUserByUsername(adminUsername);
  if (!existingAdmin) {
    await storage.createUser({
      username: adminUsername,
      password: await hashPassword("admin123"),
      fullName: "Administrator",
      email: "admin@salescrm.no",
      role: "admin",
    });
    console.log("Created dev admin user: admin / admin123");
  }

  // Seed production admin
  const prodAdminUsername = "kundeservice@smarthjem.as";
  const existingProdAdmin = await storage.getUserByUsername(prodAdminUsername);
  if (!existingProdAdmin) {
    await storage.createUser({
      username: prodAdminUsername,
      password: await hashPassword("Admin2026"),
      fullName: "Kundeservice",
      email: "kundeservice@smarthjem.as",
      role: "admin",
    });
    console.log("Created production admin user: kundeservice@smarthjem.as");
  }
}
