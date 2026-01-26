import { 
  users, customers, payouts, attachments,
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type Payout, type InsertPayout,
  type Attachment, type InsertAttachment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  getCustomersByUserId(userId: string): Promise<Customer[]>;
  getAllCustomers(): Promise<(Customer & { user?: { fullName: string; username: string } })[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined>;
  
  getPayoutsByUserId(userId: string): Promise<Payout[]>;
  getAllPayouts(): Promise<(Payout & { user?: { fullName: string; username: string; bankAccountNumber?: string | null } })[]>;
  getPayout(id: string): Promise<Payout | undefined>;
  createPayout(payout: InsertPayout): Promise<Payout>;
  updatePayout(id: string, data: Partial<Payout>): Promise<Payout | undefined>;
  
  getAttachmentsByCustomerId(customerId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getCustomersByUserId(userId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.userId, userId)).orderBy(desc(customers.createdAt));
  }

  async getAllCustomers(): Promise<(Customer & { user?: { fullName: string; username: string } })[]> {
    const allCustomers = await db.select().from(customers).orderBy(desc(customers.createdAt));
    const result = [];
    for (const customer of allCustomers) {
      const user = await this.getUser(customer.userId);
      result.push({
        ...customer,
        user: user ? { fullName: user.fullName, username: user.username } : undefined,
      });
    }
    return result;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return customer || undefined;
  }

  async getPayoutsByUserId(userId: string): Promise<Payout[]> {
    return await db.select().from(payouts).where(eq(payouts.userId, userId)).orderBy(desc(payouts.createdAt));
  }

  async getAllPayouts(): Promise<(Payout & { user?: { fullName: string; username: string; bankAccountNumber?: string | null } })[]> {
    const allPayouts = await db.select().from(payouts).orderBy(desc(payouts.createdAt));
    const result = [];
    for (const payout of allPayouts) {
      const user = await this.getUser(payout.userId);
      result.push({
        ...payout,
        user: user ? { fullName: user.fullName, username: user.username, bankAccountNumber: user.bankAccountNumber } : undefined,
      });
    }
    return result;
  }

  async getPayout(id: string): Promise<Payout | undefined> {
    const [payout] = await db.select().from(payouts).where(eq(payouts.id, id));
    return payout || undefined;
  }

  async createPayout(insertPayout: InsertPayout): Promise<Payout> {
    const [payout] = await db.insert(payouts).values(insertPayout).returning();
    return payout;
  }

  async updatePayout(id: string, data: Partial<Payout>): Promise<Payout | undefined> {
    const [payout] = await db.update(payouts).set(data).where(eq(payouts.id, id)).returning();
    return payout || undefined;
  }

  async getAttachmentsByCustomerId(customerId: string): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.customerId, customerId)).orderBy(desc(attachments.uploadedAt));
  }

  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const [attachment] = await db.insert(attachments).values(insertAttachment).returning();
    return attachment;
  }

  async deleteAttachment(id: string): Promise<boolean> {
    const result = await db.delete(attachments).where(eq(attachments.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
