import * as numbers from "../../../../kit/numbers.js";
import { ManualSubscriptionTier } from "./manual-subscription-tier.js";

/** One step of the manual subscription tier calculation. */
export interface ManualSubscriptionTierStep {
  describe(): string;
  adjust(item: ManualSubscriptionTier, value: number): number;
}

export class UnitManualSubscriptionTierAdjuster implements ManualSubscriptionTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ManualSubscriptionTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualSubscriptionTierCeilingOffsetAdjuster implements ManualSubscriptionTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ManualSubscriptionTier, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class CapManualSubscriptionTierAdjuster implements ManualSubscriptionTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualSubscriptionTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredManualSubscriptionTierAdjuster implements ManualSubscriptionTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualSubscriptionTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual subscription tier steps in order and keeps a trace of each. */
export class ManualSubscriptionTierEngine {
  steps: ManualSubscriptionTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualSubscriptionTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualSubscriptionTier): number {
    let current = item.netTotal();
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

  evaluateAll(items: ManualSubscriptionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualSubscriptionTierEngine(): ManualSubscriptionTierEngine {
  return new ManualSubscriptionTierEngine(
    [
      new UnitManualSubscriptionTierAdjuster(
        new Map<string, number>([["north", 0.76], ["west", 1.09], ["retail", 1]]),
      ),
      new ManualSubscriptionTierCeilingOffsetAdjuster(1.98),
      new CapManualSubscriptionTierAdjuster(15918),
      new TieredManualSubscriptionTierAdjuster([3247, 5592, 9587], [0.89, 1.19, 0.87]),
    ],
    [],
    0.4,
    36189,
  );
}
