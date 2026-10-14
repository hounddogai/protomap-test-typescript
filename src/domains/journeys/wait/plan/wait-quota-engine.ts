import { WaitQuota } from "./wait-quota.js";

/** One step of the wait quota calculation. */
export interface WaitQuotaStep {
  describe(): string;
  adjust(item: WaitQuota, value: number): number;
}

export class TitleWaitQuotaAdjuster implements WaitQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WaitQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWaitQuotaAdjuster implements WaitQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWaitQuotaAdjuster implements WaitQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WaitQuotaMaximumOffsetAdjuster implements WaitQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: WaitQuota, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class CapWaitQuotaAdjuster implements WaitQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWaitQuotaAdjuster implements WaitQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the wait quota steps in order and keeps a trace of each. */
export class WaitQuotaEngine {
  steps: WaitQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitQuota): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WaitQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitQuotaEngine(): WaitQuotaEngine {
  return new WaitQuotaEngine(
    [
      new TitleWaitQuotaAdjuster(new Map<string, number>([["online", 0.97], ["east", 1.16]])),
      new TieredWaitQuotaAdjuster([3257, 3571, 8453], [0.86, 1.02, 0.86]),
      new PercentWaitQuotaAdjuster(-2.4),
      new WaitQuotaMaximumOffsetAdjuster(0.82),
      new CapWaitQuotaAdjuster(4149),
      new MinimumWaitQuotaAdjuster(47.6),
    ],
    [],
    3.7,
    53376.6,
  );
}
