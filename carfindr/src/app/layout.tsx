import "@/styles/globals.css";
import { type Metadata } from "next";
import { TRPCReactProvider } from "@/trpc/react";
import { Navbar } from "@/components/navbar";
import { CookieBanner } from "@/components/CookieBanner";
import { getSession } from "@/server/auth";
import { Toaster } from "sonner";
import Script from "next/script";
import { Fraunces, Sora } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-body",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "CarFindr | Agregador de coches de segunda mano",
  description: "Busca coches de segunda mano en todas las paginas de España",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <html lang="es" className={`${sora.variable} ${fraunces.variable}`}>
      <head>
        <Script defer src="https://analytics.cachaza.cc/script.js" data-website-id="4ed585fc-6180-4ec7-8362-6d8f37770055" />
      </head>
      <body className="min-h-screen">
        <TRPCReactProvider>
          <Navbar session={session} />
          <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
            {children}
          </main>
          <CookieBanner />
          <Toaster richColors />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
