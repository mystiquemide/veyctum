/**
 * Deterministic in-memory fixed-window rate limiter (NFR-005, REV-002).
 * Keys on the Fastify `req.ip` (trustProxy-aware). In-memory is sufficient for
 * a single-process hackathon deployment; multi-instance deployments must move
 * this to a shared store.
 */
export class FixedWindowLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly windows = new Map<string, { start: number; count: number }>();

  constructor(limit: number, windowMs: number) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer');
    if (!Number.isInteger(windowMs) || windowMs < 1) throw new Error('windowMs must be a positive integer');
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /** Returns { allowed, remaining, resetMs } for a keyed request. */
  check(key: string, now = Date.now()): { allowed: boolean; remaining: number; resetMs: number } {
    const window = this.windows.get(key);
    if (!window || now - window.start >= this.windowMs) {
      this.windows.set(key, { start: now, count: 1 });
      return { allowed: true, remaining: this.limit - 1, resetMs: now + this.windowMs };
    }
    if (window.count >= this.limit) {
      return { allowed: false, remaining: 0, resetMs: window.start + this.windowMs };
    }
    window.count += 1;
    return { allowed: true, remaining: this.limit - window.count, resetMs: window.start + this.windowMs };
  }

  /** Prevent unbounded growth of idle keys (called on each check). */
  prune(now = Date.now()): void {
    for (const [key, w] of this.windows) {
      if (now - w.start >= this.windowMs) this.windows.delete(key);
    }
  }
}