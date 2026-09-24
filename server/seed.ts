import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedAdminUser() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    return;
  }

  const existing = await storage.getUserByUsername(username);
  if (existing) {
    return;
  }

  await storage.createUser({
    username,
    password: await hashPassword(password),
    fullName: process.env.ADMIN_FULL_NAME || "Administrator",
    email: process.env.ADMIN_EMAIL || username,
    role: "admin",
  });
  console.log(`Created admin user: ${username}`);
}
