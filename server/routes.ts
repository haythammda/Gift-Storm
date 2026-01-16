import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScoreSchema, adminUpdateSchema } from "@shared/schema";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

const ADMIN_KEY = process.env.ADMIN_KEY || "giftstorm-admin-2024";

function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

function isValidAdminKey(key: string | undefined): boolean {
  return key === ADMIN_KEY;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/status", async (req, res) => {
    try {
      const status = await storage.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Failed to get status:", error);
      res.status(500).json({ error: "Failed to get status" });
    }
  });

  app.get("/api/scores", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const scores = await storage.getScores(Math.min(limit, 100));
      res.json(scores);
    } catch (error) {
      console.error("Failed to get scores:", error);
      res.status(500).json({ error: "Failed to get scores" });
    }
  });

  app.post("/api/score", async (req, res) => {
    try {
      const validation = insertScoreSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid score data", 
          details: validation.error.errors 
        });
      }

      const data = validation.data;
      
      if (data.score < 0 || data.score > 999999) {
        return res.status(400).json({ error: "Score out of valid range" });
      }
      if (data.timeSurvived < 0 || data.timeSurvived > 36000) {
        return res.status(400).json({ error: "Time survived out of valid range" });
      }
      if (data.childrenHelped < 0 || data.childrenHelped > 99999) {
        return res.status(400).json({ error: "Children helped out of valid range" });
      }
      if (data.coinsEarned < 0 || data.coinsEarned > 999999) {
        return res.status(400).json({ error: "Coins earned out of valid range" });
      }

      const sanitizedScore = {
        ...data,
        playerName: sanitizeString(data.playerName).slice(0, 20),
      };

      if (sanitizedScore.playerName.length === 0) {
        return res.status(400).json({ error: "Player name is required" });
      }

      const score = await storage.addScore(sanitizedScore);
      res.status(201).json(score);
    } catch (error) {
      console.error("Failed to add score:", error);
      res.status(500).json({ error: "Failed to add score" });
    }
  });

  app.post("/api/admin/update", async (req, res) => {
    try {
      const key = req.query.key as string;
      if (!isValidAdminKey(key)) {
        return res.status(403).json({ error: "Invalid admin key" });
      }

      const validation = adminUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid update data", 
          details: validation.error.errors 
        });
      }

      const status = await storage.updateStatus(validation.data);
      res.json(status);
    } catch (error) {
      console.error("Failed to update settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/admin/simulate", async (req, res) => {
    try {
      const key = req.query.key as string;
      if (!isValidAdminKey(key)) {
        return res.status(403).json({ error: "Invalid admin key" });
      }

      const amountSchema = z.object({
        amount: z.number().positive().max(10000),
      });

      const validation = amountSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid amount", 
          details: validation.error.errors 
        });
      }

      const status = await storage.simulateDonation(validation.data.amount);
      res.json(status);
    } catch (error: any) {
      console.error("Failed to simulate donation:", error);
      if (error.message === "Dev simulation is not enabled") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to simulate donation" });
    }
  });

  app.post("/api/admin/reset-leaderboard", async (req, res) => {
    try {
      const key = req.query.key as string;
      if (!isValidAdminKey(key)) {
        return res.status(403).json({ error: "Invalid admin key" });
      }

      await storage.resetScores();
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to reset leaderboard:", error);
      res.status(500).json({ error: "Failed to reset leaderboard" });
    }
  });

  app.get("/api/stripe-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Failed to get Stripe key:", error);
      res.status(500).json({ error: "Failed to get Stripe key" });
    }
  });

  app.get("/api/donation-packages", async (req, res) => {
    try {
      const db = drizzle({ connection: process.env.DATABASE_URL! });
      
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true AND p.metadata->>'type' = 'donation'
        ORDER BY pr.unit_amount ASC
      `);

      const packages = result.rows.map((row: any) => ({
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        priceId: row.price_id,
        amount: row.unit_amount,
        currency: row.currency,
        coins: parseInt(row.product_metadata?.coins || '0'),
      }));

      res.json(packages);
    } catch (error) {
      console.error("Failed to get donation packages:", error);
      res.status(500).json({ error: "Failed to get donation packages" });
    }
  });

  app.get("/api/shop-products", async (req, res) => {
    try {
      const db = drizzle({ connection: process.env.DATABASE_URL! });
      
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true 
          AND (p.metadata->>'type' = 'gamepass' OR p.metadata->>'type' = 'skin')
        ORDER BY pr.unit_amount ASC
      `);

      const products = result.rows.map((row: any) => ({
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        priceId: row.price_id,
        amount: row.unit_amount,
        currency: row.currency,
        coins: parseInt(row.product_metadata?.coins || '0'),
        type: row.product_metadata?.type || 'unknown',
        skinId: row.product_metadata?.skinId || null,
        color: row.product_metadata?.color || null,
        perks: row.product_metadata?.perks || null,
      }));

      res.json(products);
    } catch (error) {
      console.error("Failed to get shop products:", error);
      res.status(500).json({ error: "Failed to get shop products" });
    }
  });

  // Validate and apply coupon code
  app.post("/api/validate-coupon", async (req, res) => {
    try {
      const { couponCode } = req.body;
      
      if (!couponCode) {
        return res.status(400).json({ error: "Coupon code is required", valid: false });
      }

      const stripe = await getUncachableStripeClient();
      
      // Look up promotion code by code
      const promotionCodes = await stripe.promotionCodes.list({
        code: couponCode.toUpperCase(),
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length === 0) {
        return res.json({ valid: false, error: "Invalid coupon code" });
      }

      const promoCode = promotionCodes.data[0] as any;
      const couponRef = promoCode.coupon;
      const couponId = typeof couponRef === 'string' ? couponRef : couponRef.id;
      const coupon = await stripe.coupons.retrieve(couponId);
      
      res.json({
        valid: true,
        promotionCodeId: promoCode.id,
        coupon: {
          id: coupon.id,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off,
          currency: coupon.currency,
          name: coupon.name,
        }
      });
    } catch (error) {
      console.error("Failed to validate coupon:", error);
      res.json({ valid: false, error: "Invalid coupon code" });
    }
  });

  app.post("/api/create-checkout", async (req, res) => {
    try {
      const { priceId, productType, skinId, promotionCodeId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const stripe = await getUncachableStripeClient();
      
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      let successUrl = `${baseUrl}/play?donation=success`;
      if (productType === 'gamepass') {
        successUrl += '&type=gamepass';
      } else if (productType === 'skin' && skinId) {
        successUrl += `&type=skin&skinId=${skinId}`;
      }
      
      const sessionOptions: any = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: `${baseUrl}/play?donation=cancelled`,
        allow_promotion_codes: true,  // Allow users to enter coupons at checkout
      };

      // If a pre-validated promotion code is provided, apply it
      if (promotionCodeId) {
        sessionOptions.discounts = [{ promotion_code: promotionCodeId }];
        delete sessionOptions.allow_promotion_codes; // Can't have both
      }

      const session = await stripe.checkout.sessions.create(sessionOptions);

      res.json({ url: session.url });
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  return httpServer;
}
