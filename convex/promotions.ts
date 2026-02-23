import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("promotions").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    status: v.string(),
    description: v.string(),
    items: v.array(v.object({
      skuId: v.string(),
      promoPrice: v.number(),
      rebateAmount: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("promotions", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("promotions"),
    name: v.string(),
    type: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    status: v.string(),
    description: v.string(),
    items: v.array(v.object({
      skuId: v.string(),
      promoPrice: v.number(),
      rebateAmount: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("promotions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});