type LogLevel = "error" | "warn" | "info" | "debug";

const levelWeight: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function resolveLevel(): LogLevel {
  const explicit =
    process.env.NEXT_PUBLIC_LOG_LEVEL ?? process.env.LOG_LEVEL ?? "";
  const normalized = explicit.toLowerCase();
  if (normalized === "error" || normalized === "warn" || normalized === "info" || normalized === "debug") {
    return normalized;
  }
  return process.env.NODE_ENV === "development" ? "info" : "warn";
}

const currentLevel = resolveLevel();

function shouldLog(level: LogLevel): boolean {
  return levelWeight[level] <= levelWeight[currentLevel];
}

export const logger = {
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info(...args);
  },
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.debug(...args);
  },
};
