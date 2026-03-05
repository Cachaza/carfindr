import { Car, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();

  if (session?.user) {
    redirect("/");
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-slate-50">
      {/* Left Decoration Panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex">
        {/* Abstract Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900 via-slate-900 to-slate-800" />
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-cyan-600/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 right-0 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[100px]" />

        {/* Logo Series */}
        <div className="relative z-20 flex items-center gap-3 text-2xl font-bold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-lg">
            <Car className="h-6 w-6" />
          </div>
          MotorFindr
        </div>

        {/* Testimonial / Tagline */}
        <div className="relative z-20 mt-auto mb-10 max-w-md">
          <blockquote className="space-y-4">
            <p className="text-3xl font-medium leading-tight">
              &ldquo;Encuentra tu próximo coche de segunda mano comparando todas las plataformas en un solo lugar.&rdquo;
            </p>
            <footer className="text-slate-300">
              <span className="font-semibold text-white">Búsquedas inteligentes</span> · Notificaciones · 100% gratis
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col relative">
        <div className="absolute top-4 left-4 md:top-8 md:left-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 bg-white/50 px-4 py-2 rounded-full border border-slate-200 shadow-sm backdrop-blur-md"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a inicio
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-[420px]">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
