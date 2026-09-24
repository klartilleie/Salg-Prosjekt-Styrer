import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Startup failed: DATABASE_URL is missing on the Web Service.");
  process.exit(1);
}

const useSsl =
  /render\.com/i.test(connectionString) || /sslmode=require/i.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      username text NOT NULL UNIQUE,
      password text NOT NULL,
      full_name text NOT NULL,
      email text NOT NULL,
      phone text,
      bank_account_number text,
      role text NOT NULL DEFAULT 'user',
      points integer NOT NULL DEFAULT 0,
      earnings numeric(10, 2) NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id),
      first_name text NOT NULL,
      last_name text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL,
      address text NOT NULL,
      postal_code text NOT NULL,
      city text NOT NULL,
      municipality text,
      status text NOT NULL DEFAULT 'pending',
      sale_amount numeric(10, 2),
      points_awarded integer DEFAULT 0,
      commission_amount numeric(10, 2),
      notes text,
      source text NOT NULL DEFAULT 'app',
      created_at timestamp NOT NULL DEFAULT now(),
      approved_at timestamp,
      approved_by varchar REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payouts (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id),
      amount numeric(10, 2) NOT NULL,
      paid_amount numeric(10, 2),
      status text NOT NULL DEFAULT 'pending',
      notes text,
      created_at timestamp NOT NULL DEFAULT now(),
      processed_at timestamp,
      processed_by varchar REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id varchar NOT NULL REFERENCES customers(id),
      file_name text NOT NULL,
      file_url text NOT NULL,
      file_size integer,
      mime_type text,
      uploaded_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "session" (
      sid varchar NOT NULL COLLATE "default",
      sess json NOT NULL,
      expire timestamp(6) NOT NULL,
      CONSTRAINT session_pkey PRIMARY KEY (sid)
    );

    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" (expire);

    ALTER TABLE customers ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';
  `);
}
