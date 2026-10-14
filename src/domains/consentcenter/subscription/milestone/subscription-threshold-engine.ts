import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionThreshold } from "./subscription-threshold.js";

/** One step of the subscription threshold calculation. */
export interface SubscriptionThresholdFactor {
  describe(): string;
  adjust(item: SubscriptionThreshold, value: number): number;
}

export class SubscriptionThresholdVersionOffsetAdjuster implements SubscriptionThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: SubscriptionThreshold, value: number): number {
    return value + item.version * this.weight;
  }
}

export class TieredSubscriptionThresholdAdjuster implements SubscriptionThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceSubscriptionThresholdAdjuster implements SubscriptionThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: SubscriptionThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the subscription threshold steps in order and keeps a trace of each. */
export class SubscriptionThresholdEngine {
  steps: SubscriptionThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SubscriptionThreshold): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SubscriptionThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSubscriptionThresholdEngine(): SubscriptionThresholdEngine {
  return new SubscriptionThresholdEngine(
    [
      new SubscriptionThresholdVersionOffsetAdjuster(0.65),
      new TieredSubscriptionThresholdAdjuster([928, 6540, 8454], [0.85, 0.95, 1.04]),
      new UtmSourceSubscriptionThresholdAdjuster(new Map<string, number>([["south", 1.24]])),
    ],
    [],
    1.7,
    43819.3,
  );
}
