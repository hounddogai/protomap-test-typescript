import { ScheduledBounceQuota } from "./scheduled-bounce-quota.js";

/** One step of the scheduled bounce quota calculation. */
export interface ScheduledBounceQuotaFactor {
  describe(): string;
  adjust(item: ScheduledBounceQuota, value: number): number;
}

export class MinimumScheduledBounceQuotaAdjuster implements ScheduledBounceQuotaFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledBounceQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledBounceQuotaAdjuster implements ScheduledBounceQuotaFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledBounceQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceScheduledBounceQuotaAdjuster implements ScheduledBounceQuotaFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ScheduledBounceQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled bounce quota steps in order and keeps a trace of each. */
export class ScheduledBounceQuotaEngine {
  steps: ScheduledBounceQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledBounceQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledBounceQuota): number {
    let current = item.weightedValue();
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

  evaluateAll(items: ScheduledBounceQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledBounceQuotaEngine(): ScheduledBounceQuotaEngine {
  return new ScheduledBounceQuotaEngine(
    [
      new MinimumScheduledBounceQuotaAdjuster(10.1),
      new CapScheduledBounceQuotaAdjuster(19157),
      new UtmSourceScheduledBounceQuotaAdjuster(new Map<string, number>([["online", 1.05]])),
    ],
    [],
    3.8,
    58894.9,
  );
}
