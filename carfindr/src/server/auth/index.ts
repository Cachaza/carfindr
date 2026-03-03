import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { WelcomeEmail } from "@/components/emails/WelcomeEmail";
import { db } from "@/server/db";
import { accounts, sessions, users, verifications } from "@/server/db/schema";
import { Resend } from "resend";

const authSecret = env.AUTH_SECRET ?? "dev-only-auth-secret-change-me-1234567890";

export const auth = betterAuth({
  secret: authSecret,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      account: accounts,
      session: sessions,
      verification: verifications,
    },
  }),
  socialProviders: {
    discord: {
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (!user.email || !env.RESEND_API_KEY) {
            if (!user.email) {
              logger.warn("User email not available for sending welcome email.");
            }
            if (!env.RESEND_API_KEY) {
              logger.warn("Resend API key not configured. Cannot send welcome email.");
            }
            return;
          }

          const resend = new Resend(env.RESEND_API_KEY);
          try {
            await resend.emails.send({
              from: "CarFindr <send@carfindr.cachaza.cc>",
              to: user.email,
              subject: "Bienvenido a CarFindr!",
              react: WelcomeEmail({ userName: user.name ?? "nuevo usuario" }),
            });
            logger.info("Welcome email sent to:", user.email);
          } catch (error) {
            logger.error("Error sending welcome email:", error);
          }
        },
      },
    },
  },
});

export const getSession = async () =>
  auth.api.getSession({
    headers: await headers(),
  });
