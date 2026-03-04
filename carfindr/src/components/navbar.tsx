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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/favicon.ico"
            alt="MotorFindr logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-lg font-semibold text-slate-900">MotorFindr</span>
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-slate-700 hover:bg-slate-100 sm:inline-flex"
              onClick={() => router.push("/user")}
            >
              <User className="mr-1 h-4 w-4" />
              Mi perfil
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-slate-700 hover:bg-slate-100 sm:hidden"
              onClick={() => router.push("/user")}
            >
              <User size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-slate-700 hover:bg-slate-100"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button
                variant="default"
                className="h-9 rounded-lg bg-cyan-600 px-4 text-white hover:bg-cyan-500"
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
