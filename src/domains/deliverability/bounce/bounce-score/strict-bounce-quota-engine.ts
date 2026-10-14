import { StrictBounceQuota } from "./strict-bounce-quota.js";

/** One step of the strict bounce quota calculation. */
export interface StrictBounceQuotaStep {
  describe(): string;
  adjust(item: StrictBounceQuota, value: number): number;
}

export class CapStrictBounceQuotaAdjuster implements StrictBounceQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictBounceQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumStrictBounceQuotaAdjuster implements StrictBounceQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictBounceQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredStrictBounceQuotaAdjuster implements StrictBounceQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictBounceQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentStrictBounceQuotaAdjuster implements StrictBounceQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictBounceQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict bounce quota steps in order and keeps a trace of each. */
export class StrictBounceQuotaEngine {
  steps: StrictBounceQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBounceQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictBounceQuota): number {
    let current = item.projectedExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: StrictBounceQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictBounceQuotaEngine(): StrictBounceQuotaEngine {
  return new StrictBounceQuotaEngine(
    [
      new CapStrictBounceQuotaAdjuster(32454),
      new MinimumStrictBounceQuotaAdjuster(1),
      new TieredStrictBounceQuotaAdjuster([4219, 6489], [1.06, 1.19]),
      new PercentStrictBounceQuotaAdjuster(3.4),
    ],
    [],
    3.9,
    41381.4,
  );
}
