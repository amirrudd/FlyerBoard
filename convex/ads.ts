import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAds = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    search: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      const ads = await ctx.db
        .query("ads")
        .withSearchIndex("search_ads", (q) => {
          let searchQuery = q.search("title", args.search!);
          
          if (args.categoryId) {
            searchQuery = searchQuery.eq("categoryId", args.categoryId);
          }
          if (args.location) {
            searchQuery = searchQuery.eq("location", args.location);
          }
          
          // Filter out deleted and inactive ads
          searchQuery = searchQuery.eq("isActive", true);
          
          return searchQuery;
        })
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect();

      return ads;
    } else {
      if (args.categoryId) {
        const ads = await ctx.db
          .query("ads")
          .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
          .filter((q) => 
            q.and(
              q.eq(q.field("isActive"), true),
              q.neq(q.field("isDeleted"), true)
            )
          )
          .order("desc")
          .collect();

        // Apply location filter if specified
        if (args.location) {
          return ads.filter(ad => ad.location === args.location);
        }
        return ads;
      } else {
        const ads = await ctx.db
          .query("ads")
          .filter((q) => 
            q.and(
              q.eq(q.field("isActive"), true),
              q.neq(q.field("isDeleted"), true)
            )
          )
          .order("desc")
          .collect();

        // Apply location filter if specified
        if (args.location) {
          return ads.filter(ad => ad.location === args.location);
        }
        return ads;
      }
    }
  },
});

export const getAdById = query({
  args: { adId: v.id("ads") },
  handler: async (ctx, args) => {
    const ad = await ctx.db.get(args.adId);
    
    // Return null if ad is deleted or doesn't exist
    if (!ad || ad.isDeleted) {
      return null;
    }
    
    return ad;
  },
});

export const incrementViews = mutation({
  args: { adId: v.id("ads") },
  handler: async (ctx, args) => {
    const ad = await ctx.db.get(args.adId);
    if (!ad || ad.isDeleted) {
      throw new Error("Ad not found");
    }

    await ctx.db.patch(args.adId, {
      views: ad.views + 1,
    });

    return { success: true };
  },
});
