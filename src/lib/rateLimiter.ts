/**
 * Rate Limiter - Token bucket algorithm for API rate limiting
 */

/**
 * Simple rate limiter using token bucket algorithm
 * Tracks requests per minute (RPM) limit
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;

  constructor(rateLimitRpm: number) {
    this.maxTokens = rateLimitRpm;
    this.tokens = rateLimitRpm;
    this.lastRefill = Date.now();
    // Refill one token every (60_000 / rpm) milliseconds
    this.refillIntervalMs = 60_000 / rateLimitRpm;
  }

  /**
   * Wait until a token is available, then consume it
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Calculate wait time until next token is available
    const waitMs = this.refillIntervalMs;
    await this.sleep(waitMs);
    this.refill();
    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now - (elapsed % this.refillIntervalMs);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}