"use client";

import { Button } from "@/components/ui/button";

interface CookiePreferencesButtonProps {
  className?: string;
}

export function CookiePreferencesButton({
  className,
}: CookiePreferencesButtonProps) {
  const openCookiePreferences = () => {
    window.localStorage.removeItem("cookie-consent");
    window.dispatchEvent(new Event("open-cookie-banner"));
  };

  return (
    <Button
      variant="ghost"
      className={className}
      onClick={openCookiePreferences}
    >
      Cambiar cookies
    </Button>
  );
}
