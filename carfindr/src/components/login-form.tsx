"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import posthog from "posthog-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenido</CardTitle>
          <CardDescription>
            Accede con email y contraseña, o usa Google/Discord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleCredentialsSubmit(event)}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={mode === "login" ? "default" : "outline"}
                  onClick={() => switchMode("login")}
                  disabled={isLoading}
                >
                  Iniciar sesión
                </Button>
                <Button
                  type="button"
                  variant={mode === "register" ? "default" : "outline"}
                  onClick={() => switchMode("register")}
                  disabled={isLoading}
                >
                  Crear cuenta
                </Button>
              </div>

              {mode === "register" && (
                <div className="grid gap-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    placeholder="Tu nombre de usuario"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    minLength={2}
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>

              {mode === "register" && (
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Repite la contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Escribe la misma contraseña"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                </div>
              )}

              {formError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Procesando..."
                  : mode === "register"
                    ? "Crear cuenta"
                    : "Entrar"}
              </Button>

              <div className="relative py-1 text-center text-xs uppercase text-muted-foreground">
                <span className="bg-background px-2">o continua con</span>
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => {
                    void handleSignIn("discord");
                  }}
                >
                  Continuar con Discord
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => {
                    void handleSignIn("google");
                  }}
                >
                  Continuar con Google
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        Al hacer clic en continuar, aceptas nuestros{" "}
        <a href="#">Términos de Servicio</a> y{" "}
        <a href="#">Política de Privacidad</a>.
      </div>
    </div>
  );
}
