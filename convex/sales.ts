import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sales").order("desc").collect();
  },
});

export const submit = mutation({
  args: {
    promotionId: v.string(),
    partnerId: v.string(),
    skuId: v.string(),
    quantitySold: v.number(),
    claimPercentage: v.number(),
    submittedAt: v.string(),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sales", { ...args, paymentStatus: 'UNPAID' });
  },
});

export const update = mutation({
  args: {
    id: v.id("sales"),
    paymentStatus: v.string(),
    paymentReference: v.string(),
    paymentDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});