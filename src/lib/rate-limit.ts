type LimitConfig = {
  limit: number;
  windowMs: number;
};

type LimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const store = new Map<string, number[]>();

function pruneTimestamps(timestamps: number[], windowMs: number, now: number) {
  return timestamps.filter((value) => now - value < windowMs);
}

export function checkRateLimit(key: string, config: LimitConfig): LimitResult {
  const now = Date.now();
  const current = pruneTimestamps(store.get(key) ?? [], config.windowMs, now);

  if (current.length >= config.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((config.windowMs - (now - current[0])) / 1000)
    );

    store.set(key, current);

    return {
      allowed: false,
      retryAfterSeconds
    };
  }

  current.push(now);
  store.set(key, current);

  return {
    allowed: true,
    retryAfterSeconds: 0
  };
}
