import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partners").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    email: v.string(),
    country: v.string(),
    discountRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("partners", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("partners"),
    name: v.string(),
    type: v.string(),
    email: v.string(),
    country: v.string(),
    discountRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("partners") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});