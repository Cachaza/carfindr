import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { savedSearches } from "@/server/db/schema";
import { eq, and } from "drizzle-orm"; // Import eq and and for where clause
import { TRPCError } from "@trpc/server";

export const savedSearchRouter = createTRPCRouter({
  saveSearch: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(), // Optional name for the search
        brandId: z.string().nullable().optional(),
        modelId: z.string().nullable().optional(),
        yearFrom: z.number().nullable().optional(),
        yearTo: z.number().nullable().optional(),
        priceFrom: z.number().nullable().optional(),
        priceTo: z.number().nullable().optional(),
        kmFrom: z.number().nullable().optional(),
        kmTo: z.number().nullable().optional(),
        transmission: z.string().nullable().optional(),
        searchText: z.string().nullable().optional(),
        brandParam: z.string().nullable().optional(),
        modelParam: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(savedSearches).values({
        userId: ctx.session.user.id,
        name: input.name,
        brandId: input.brandId,
        modelId: input.modelId,
        yearFrom: input.yearFrom,
        yearTo: input.yearTo,
        priceFrom: input.priceFrom,
        priceTo: input.priceTo,
        kmFrom: input.kmFrom,
        kmTo: input.kmTo,
        transmission: input.transmission,
        searchText: input.searchText,
        brandParam: input.brandParam,
        modelParam: input.modelParam,
      });
      return { success: true, message: "Search saved successfully!" };
    }),

  getMySearches: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error("User not authenticated");
      }
      return ctx.db.query.savedSearches.findMany({
        where: (searches, { eq }) => eq(searches.userId, ctx.session.user.id),
        orderBy: (searches, { desc }) => [desc(searches.createdAt)],
        limit: input?.limit,
      });
    }),

  deleteSearch: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated." });
      }

      const searchToDelete = await ctx.db.query.savedSearches.findFirst({
        where: eq(savedSearches.id, input.id),
      });

      if (!searchToDelete) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Búsqueda guardada no encontrada." });
      }

      if (searchToDelete.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para eliminar esta búsqueda." });
      }

      await ctx.db
        .delete(savedSearches)
        .where(and(eq(savedSearches.id, input.id), eq(savedSearches.userId, ctx.session.user.id)));
      
      return { success: true, message: "Búsqueda eliminada correctamente." };
    }),
});
