import * as numbers from "../../../../kit/numbers.js";
import { RegionalOptOutQuota } from "./regional-opt-out-quota.js";

/** One step of the regional opt out quota calculation. */
export interface RegionalOptOutQuotaStep {
  describe(): string;
  adjust(item: RegionalOptOutQuota, value: number): number;
}

export class PercentRegionalOptOutQuotaAdjuster implements RegionalOptOutQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalOptOutQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalOptOutQuotaAdjuster implements RegionalOptOutQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalOptOutQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRegionalOptOutQuotaAdjuster implements RegionalOptOutQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalOptOutQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRegionalOptOutQuotaAdjuster implements RegionalOptOutQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalOptOutQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional opt out quota steps in order and keeps a trace of each. */
export class RegionalOptOutQuotaEngine {
  steps: RegionalOptOutQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalOptOutQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalOptOutQuota): number {
    let current = item.adjustedExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: RegionalOptOutQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalOptOutQuotaEngine(): RegionalOptOutQuotaEngine {
  return new RegionalOptOutQuotaEngine(
    [
      new PercentRegionalOptOutQuotaAdjuster(2.7),
      new TieredRegionalOptOutQuotaAdjuster([289, 5494], [0.96, 0.85]),
      new MinimumRegionalOptOutQuotaAdjuster(8.5),
      new RoundingRegionalOptOutQuotaAdjuster(0.1),
    ],
    [],
    1.6,
    49582.9,
  );
}
