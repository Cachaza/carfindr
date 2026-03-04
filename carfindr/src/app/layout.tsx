import "@/styles/globals.css";
import { type Metadata } from "next";
import { TRPCReactProvider } from "@/trpc/react";
import { Navbar } from "@/components/navbar";
import { CookieBanner } from "@/components/CookieBanner";
import { CookiePreferencesButton } from "@/components/CookiePreferencesButton";
import { getSession } from "@/server/auth";
import { Toaster } from "sonner";
import Script from "next/script";
import Link from "next/link";
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
  title: "MotorFindr | Agregador de coches de segunda mano",
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
          <div className="flex min-h-screen flex-col">
            <Navbar session={session} />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer id="site-footer" className="border-t border-slate-200 bg-white/80">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p>MotorFindr</p>
                <div className="flex items-center gap-4">
                  <Link href="/privacidad" className="hover:text-slate-900">
                    Privacidad
                  </Link>
                  <Link href="/cookies" className="hover:text-slate-900">
                    Cookies
                  </Link>
                  <CookiePreferencesButton className="h-auto p-0 text-sm text-slate-600 hover:bg-transparent hover:text-slate-900" />
                </div>
              </div>
            </footer>
          </div>
          <CookieBanner />
          <Toaster richColors />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
