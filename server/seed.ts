import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedAdminUser() {
  const adminUsername = "admin";
  
  const existingAdmin = await storage.getUserByUsername(adminUsername);
  if (existingAdmin) {
    console.log("Admin user already exists");
    return;
  }

  const adminUser = await storage.createUser({
    username: adminUsername,
    password: await hashPassword("admin123"),
    fullName: "Administrator",
    email: "admin@salescrm.no",
    role: "admin",
  });

  console.log("Created admin user:", adminUser.username);
  console.log("Default login: admin / admin123");
}
