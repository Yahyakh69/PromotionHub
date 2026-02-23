import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  skus: defineTable({
    code: v.string(),
    name: v.string(),
    category: v.string(),
    originalPrice: v.number(),
  }),
  partners: defineTable({
    name: v.string(),
    type: v.string(), // "DEALER" | "TRADER"
    email: v.string(),
    country: v.string(),
    discountRate: v.optional(v.number()),
  }),
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.string(), // "ADMIN" | "PARTNER"
    partnerId: v.optional(v.string()),
  }),
  promotions: defineTable({
    name: v.string(),
    type: v.optional(v.string()), // PROMO | PRICE_DROP
    startDate: v.string(),
    endDate: v.string(),
    status: v.string(), // "DRAFT" | "ACTIVE" | "COMPLETED"
    description: v.string(),
    items: v.array(v.object({
        skuId: v.string(),
        promoPrice: v.number(),
        rebateAmount: v.number(),
    })),
  }),
  sales: defineTable({
    promotionId: v.string(),
    partnerId: v.string(),
    skuId: v.string(),
    quantitySold: v.number(),
    claimPercentage: v.number(),
    submittedAt: v.string(),
    paymentStatus: v.optional(v.string()), // PAID | UNPAID
    paymentReference: v.optional(v.string()),
    paymentDate: v.optional(v.string()),
  }),
});