type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

function sanitize(meta: LogMeta = {}) {
  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (value instanceof Error) {
        return [key, value.message];
      }

      if (typeof value === "string" && value.length > 800) {
        return [key, `${value.slice(0, 800)}...`];
      }

      return [key, value];
    })
  );
}

function print(level: LogLevel, event: string, meta?: LogMeta) {
  const payload = {
    level,
    event,
    at: new Date().toISOString(),
    ...sanitize(meta)
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}

export function logInfo(event: string, meta?: LogMeta) {
  print("info", event, meta);
}

export function logWarn(event: string, meta?: LogMeta) {
  print("warn", event, meta);
}

export function logError(event: string, meta?: LogMeta) {
  print("error", event, meta);
}
