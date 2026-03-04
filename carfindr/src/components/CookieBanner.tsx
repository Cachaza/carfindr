"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem("cookie-consent");

    if (cookieConsent === "accepted") {
      posthog.opt_in_capturing();
      return;
    }

    if (cookieConsent === "declined") {
      posthog.opt_out_capturing();
      return;
    }

    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    const openBanner = () => {
      posthog.opt_out_capturing();
      setShowBanner(true);
    };

    window.addEventListener("open-cookie-banner", openBanner);
    return () => window.removeEventListener("open-cookie-banner", openBanner);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    posthog.opt_in_capturing();
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    posthog.opt_out_capturing();
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          <p>
            Usamos cookies de analitica para medir uso y mejorar MotorFindr. Puedes
            aceptar o rechazar estas cookies en cualquier momento. Mas informacion en
            nuestra {" "}
            <Link href="/privacidad" className="underline underline-offset-2">
              Politica de Privacidad
            </Link>{" "}
            y {" "}
            <Link href="/cookies" className="underline underline-offset-2">
              Politica de Cookies
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={declineCookies}
            className="whitespace-nowrap"
          >
            Rechazar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={acceptCookies}
            className="whitespace-nowrap"
          >
            Aceptar analitica
          </Button>
        </div>
      </div>
    </div>
  );
}
