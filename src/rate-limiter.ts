export class RateLimiter {
  max: number;
  tokens: number;
  refillRate: number;
  lastRefill: number;

  constructor(max: number, refillRate: number) {
    this.max = max;
    this.tokens = max;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  async consume(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitMs = (1 / this.refillRate) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return this.consume();
  }
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.max, this.tokens + newTokens);
    this.lastRefill = now;
  }
}
