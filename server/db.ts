import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use external database (salg_db) if available, otherwise fall back to DATABASE_URL
const connectionString = process.env.salg_db || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Database connection string must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString,
  ssl: process.env.salg_db ? { rejectUnauthorized: false } : undefined
});
export const db = drizzle(pool, { schema });
