"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import posthog from "posthog-js";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Loader2, ArrowRight } from "lucide-react";

// Simple custom SVG Icons for social login
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg className="mr-2 h-4 w-4" fill="#5865F2" viewBox="0 -28.5 256 256">
    <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 158.933863,8.52776266 157.19523,13.111867 C138.868739,10.3643798 120.573215,10.3643798 102.664426,13.111867 C100.925793,8.52776266 98.053706,4.11318106 95.7392395,0 C77.2146584,3.2084988 59.4957999,8.84328665 42.9244626,16.5966031 C4.32187784,74.7709349 -4.01358514,131.849647 1.6372583,188.243542 C23.8643886,204.606214 45.4740702,214.397063 66.8660394,220.916723 C72.1764639,213.660312 76.9942461,205.908027 81.2064561,197.669866 C73.4912953,194.757053 66.1138241,191.076891 59.0886562,186.72658 C60.9634706,185.340914 62.7787995,183.842795 64.4947935,182.235914 C104.912752,200.865961 144.380753,200.865961 184.453051,182.235914 C186.169045,183.842795 187.984374,185.340914 189.938637,186.72658 C182.874015,191.116246 175.496544,194.796407 167.741929,197.669866 C171.954139,205.908027 176.771921,213.660312 182.082346,220.916723 C203.474315,214.397063 225.083997,204.606214 247.350574,188.243542 C253.948259,122.955446 240.231267,66.1444155 216.856339,16.5966031 Z M85.4738752,153.579327 C75.5487754,153.579327 67.3871408,144.409395 67.3871408,133.206132 C67.3871408,122.00287 75.3134375,112.832938 85.4738752,112.832938 C95.634313,112.832938 103.795948,122.00287 103.56061,133.206132 C103.56061,144.409395 95.634313,153.579327 85.4738752,153.579327 Z M164.041564,153.579327 C154.116465,153.579327 145.95483,144.409395 145.95483,133.206132 C145.95483,122.00287 153.881127,112.832938 164.041564,112.832938 C174.202002,112.832938 182.363637,122.00287 182.128299,133.206132 C182.128299,144.409395 174.202002,153.579327 164.041564,153.579327 Z" />
  </svg>
);

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setFormError(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSignIn = async (
    provider: "discord" | "google",
  ): Promise<void> => {
    setIsLoading(true);
    posthog.capture("user_logged_in", { method: provider });
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);

    if (mode === "register") {
      if (username.trim().length < 2) {
        setFormError("El nombre de usuario debe tener al menos 2 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setFormError("Las contraseñas no coinciden.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "register") {
        const { error } = await authClient.signUp.email({
          name: username.trim(),
          email,
          password,
          callbackURL: "/",
        });

        if (error) {
          setFormError(error.message || "No se pudo crear la cuenta.");
          toast.error(error.message || "No se pudo crear la cuenta.");
          posthog.captureException(
            new Error(error.message ?? "Sign up failed"),
          );
          return;
        }

        posthog.capture("user_signed_up", { method: "email" });
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        toast.success("Cuenta creada correctamente.");
        return;
      }

      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
      });

      if (error) {
        setFormError(error.message || "Credenciales no válidas.");
        toast.error(error.message || "Credenciales no validas.");
        posthog.captureException(new Error(error.message ?? "Sign in failed"));
      } else {
        posthog.capture("user_logged_in", { method: "email" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      <div className="flex flex-col space-y-2 text-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {mode === "login" ? "Bienvenido de nuevo" : "Crear una cuenta"}
        </h1>
        <p className="text-sm text-slate-500">
          {mode === "login"
            ? "Accede introduciendo tu email y contraseña"
            : "Regístrate para guardar y configurar alertas"}
        </p>
      </div>

      <div className="bg-slate-200/50 p-1 flex rounded-xl mb-2">
        <button
          type="button"
          onClick={() => switchMode("login")}
          disabled={isLoading}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
            mode === "login"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          disabled={isLoading}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
            mode === "register"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={(event) => void handleCredentialsSubmit(event)}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4"
          >
            {mode === "register" && (
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-slate-700">Usuario</Label>
                <Input
                  id="username"
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  minLength={2}
                  disabled={isLoading}
                  className="h-11 rounded-xl bg-white border-slate-200"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isLoading}
                className="h-11 rounded-xl bg-white border-slate-200"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">Contraseña</Label>
                {mode === "login" && (
                  <a href="#" className="text-xs font-medium text-cyan-600 hover:underline">
                    ¿La has olvidado?
                  </a>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="h-11 rounded-xl bg-white border-slate-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-slate-700">Repite la contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Escribe la misma contraseña"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                    className="h-11 rounded-xl bg-white border-slate-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {formError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </motion.p>
            )}

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="h-11 mt-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-900/10 flex items-center justify-center transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mode === "register" ? (
                "Crear cuenta"
              ) : (
                "Entrar con Email"
              )}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </motion.div>
        </AnimatePresence>
      </form>

      <div className="text-balance text-center text-xs text-slate-500 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-slate-900 mt-4">
        Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y <a href="#">Política de Privacidad</a>.
      </div>
    </div>
  );
}
