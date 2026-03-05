"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface NavbarProps {
  session: {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
}


export function Navbar({ session }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link 
          href="/" 
          className="group flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 origin-left"
        >
          <Image
            src="/favicon.ico"
            alt="MotorFindr logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-cyan-700 transition-colors">
            MotorFindr
          </span>
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden h-9 px-4 text-slate-700 font-medium border-slate-200 shadow-sm hover:bg-slate-50 hover:text-cyan-700 sm:inline-flex"
              onClick={() => router.push("/user")}
            >
              <User className="mr-2 h-4 w-4" />
              Mi perfil
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 sm:hidden"
              onClick={() => router.push("/user")}
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="default"
                className="h-10 rounded-xl bg-cyan-600 px-5 font-medium text-white shadow-sm shadow-cyan-900/20 transition-all hover:bg-cyan-500 hover:shadow-cyan-900/30 active:scale-95"
              >
                Iniciar sesión
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
