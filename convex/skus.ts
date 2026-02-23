import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("skus").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    category: v.string(),
    originalPrice: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("skus", args);
  },
});

export const createBatch = mutation({
  args: {
    skus: v.array(v.object({
      code: v.string(),
      name: v.string(),
      category: v.string(),
      originalPrice: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    await Promise.all(args.skus.map(sku => ctx.db.insert("skus", sku)));
  },
});

export const update = mutation({
  args: {
    id: v.id("skus"),
    code: v.string(),
    name: v.string(),
    category: v.string(),
    originalPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("skus") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const removeBatch = mutation({
  args: { ids: v.array(v.id("skus")) },
  handler: async (ctx, args) => {
    await Promise.all(args.ids.map(id => ctx.db.delete(id)));
  },
});