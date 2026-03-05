import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && posthogKey) {
  const consent = window.localStorage.getItem("cookie-consent");

  posthog.init(posthogKey, {
    api_host: "/ingest",
    ui_host: "https://a.motorfindr.app",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    opt_out_capturing_by_default: true,
  });

  if (consent === "accepted") {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
}
