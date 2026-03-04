import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
// DrizzleAdapter is no longer used directly in this mutation
// import { DrizzleAdapter } from "@auth/drizzle-adapter"; 

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { 
  users, 
  accounts, 
  sessions, 
  savedSearches, 
  searchedCarListings, 
  verifications
} from "@/server/db/schema";
import { db } from "@/server/db";
import { Resend } from 'resend';
import { env } from '@/env';
import { UserDataReportEmail } from '@/components/emails/UserDataReportEmail';
import { TRPCError } from "@trpc/server";

// tableConfig and DrizzleAdapter instance are not needed here anymore as we perform explicit deletes.

export const userRouter = createTRPCRouter({
  requestDataReport: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const userEmail = ctx.session.user.email;
      const userName = ctx.session.user.name;

      if (!userId || !userEmail) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID or email not found in session.',
        });
      }

      if (!env.RESEND_API_KEY) {
        console.error('Resend API key not configured. Cannot send data report email.');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Email configuration error.',
        });
      }

      try {
        // Fetch user data
        const userData = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!userData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found.',
          });
        }

        // Fetch linked accounts
        const userAccounts = await db.query.accounts.findMany({
          where: eq(accounts.userId, userId),
          columns: {
            providerId: true,
            accountId: true,
          }
        });

        // Fetch saved searches
        const userSavedSearches = await db.query.savedSearches.findMany({
          where: eq(savedSearches.userId, userId),
          columns: {
            id: true,
            name: true,
            // query: true, // This was the problematic line
            brandId: true,
            modelId: true,
            yearFrom: true,
            yearTo: true,
            priceFrom: true,
            priceTo: true,
            kmFrom: true,
            kmTo: true,
            transmission: true,
            searchText: true,
            brandParam: true,
            modelParam: true,
            createdAt: true,
          }
        });
        
        const resend = new Resend(env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'MotorFindr Compliance <send@motorfindr.cachaza.cc>',
          to: userEmail,
          subject: 'Tu Informe de Datos de MotorFindr',
          react: UserDataReportEmail({
            userName: userName,
            userData: {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              emailVerified: userData.emailVerified,
              image: userData.image,
            },
            accounts: userAccounts,
            savedSearches: userSavedSearches,
          }),
        });

        return { success: true, message: "Tu informe de datos ha sido enviado a tu correo electrónico." };
      } catch (error) {
        console.error("Failed to send data report:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No se pudo enviar el informe de datos.',
          cause: error,
        });
      }
    }),

  deleteAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const userEmail = ctx.session.user.email;

      if (!userId) {
        throw new Error("User ID not found in session.");
      }
      if (!userEmail) {
        throw new Error("User email not found in session. Required for full cleanup.");
      }

      try {
        await db.transaction(async (tx) => {
          // Step 1: Delete searchedCarListings associated with the user's savedSearches
          const userSavedSearches = await tx.query.savedSearches.findMany({
            where: eq(savedSearches.userId, userId),
            columns: { id: true },
          });

          if (userSavedSearches.length > 0) {
            const savedSearchIds = userSavedSearches.map(s => s.id);
            // Ensure savedSearchIds is not empty before attempting delete, to avoid issues with `inArray` and empty arrays.
            if (savedSearchIds.length > 0) {
              await tx.delete(searchedCarListings).where(inArray(searchedCarListings.savedSearchId, savedSearchIds));
            }
          }
          
          // Step 2: Delete savedSearches for the user
          await tx.delete(savedSearches).where(eq(savedSearches.userId, userId));

          // Step 3: Delete accounts associated with the user (Auth.js table)
          await tx.delete(accounts).where(eq(accounts.userId, userId));
          
          // Step 4: Delete sessions associated with the user (Auth.js table)
          await tx.delete(sessions).where(eq(sessions.userId, userId));
          
          // Step 5: Delete verification rows associated with the user's email
          await tx.delete(verifications).where(eq(verifications.identifier, userEmail));
          
          // Step 6: Finally, delete the user record itself
          await tx.delete(users).where(eq(users.id, userId));
        });

        // Client-side sign-out will be handled by the frontend component.
        // The client will need to handle the response of this mutation and trigger signout.

        return { success: true, message: "Account deleted successfully. You will be signed out." };
      } catch (error) {
        console.error("Failed to delete account:", error);
        // Consider using TRPCError for structured errors
        // import { TRPCError } from "@trpc/server";
        // throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete account.', cause: error });
        throw error; // Rethrow original error for now
      }
    }),
});
