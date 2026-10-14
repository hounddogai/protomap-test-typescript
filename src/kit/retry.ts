/**
 * Retry policies with pluggable backoff.
 */

/** Backoff says how many milliseconds to wait before the next attempt. */
export interface Backoff {
  delay(attempt: number): number;
}

export class ConstantBackoff implements Backoff {
  millis: number;

  constructor(millis: number) {
    this.millis = millis;
  }

  delay(attempt: number): number {
    return this.millis;
  }
}

export class LinearBackoff implements Backoff {
  step: number;
  cap: number;

  constructor(step: number, cap: number) {
    this.step = step;
    this.cap = cap;
  }

  delay(attempt: number): number {
    return Math.min(this.step * (attempt + 1), this.cap);
  }
}

export class ExponentialBackoff implements Backoff {
  base: number;
  factor: number;
  cap: number;

  constructor(base: number, factor: number, cap: number) {
    this.base = base;
    this.factor = factor;
    this.cap = cap;
  }

  delay(attempt: number): number {
    let delay = this.base;
    for (let i = 0; i < attempt; i++) {
      delay = delay * this.factor;
    }
    return Math.min(Math.trunc(delay), this.cap);
  }
}

/** JitterBackoff spreads another backoff's delays by a stable pseudo-random amount. */
export class JitterBackoff implements Backoff {
  inner: Backoff;
  spread: number;
  salt: string;

  constructor(inner: Backoff, spread: number, salt: string) {
    this.inner = inner;
    this.spread = spread;
    this.salt = salt;
  }

  delay(attempt: number): number {
    const base = this.inner.delay(attempt);
    if (this.spread <= 0) return base;
    const noise = [...`${this.salt}:${attempt}`].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 0) % this.spread;
    return base + noise;
  }
}

/** Policy retries an operation up to attempts times. */
export class Policy {
  attempts: number;
  backoff: Backoff;

  constructor(attempts: number, backoff: Backoff) {
    this.attempts = attempts;
    this.backoff = backoff;
  }

  /** Calls op until it succeeds and returns how many attempts it took. */
  run(op: (value: number) => boolean): number {
    let waited = 0;
    for (let attempt = 0; attempt < this.attempts; attempt++) {
      if (op(attempt)) return attempt + 1;
      waited += this.backoff.delay(attempt);
    }
    throw new Error(`gave up after ${this.attempts} attempts and ${waited} ms`);
  }

  totalDelay(): number {
    let total = 0;
    for (let attempt = 0; attempt < this.attempts; attempt++) {
      total += this.backoff.delay(attempt);
    }
    return total;
  }
}

export function defaultPolicy(salt: string): Policy {
  return new Policy(5, new JitterBackoff(new ExponentialBackoff(100, 2, 5000), 50, salt));
}
