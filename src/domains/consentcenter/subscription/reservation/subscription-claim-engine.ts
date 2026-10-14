import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionClaim } from "./subscription-claim.js";

/** One step of the subscription claim calculation. */
export interface SubscriptionClaimModifier {
  describe(): string;
  adjust(item: SubscriptionClaim, value: number): number;
}

export class PercentSubscriptionClaimAdjuster implements SubscriptionClaimModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSubscriptionClaimAdjuster implements SubscriptionClaimModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSubscriptionClaimAdjuster implements SubscriptionClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SubscriptionClaimDiscountOffsetAdjuster implements SubscriptionClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: SubscriptionClaim, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the subscription claim steps in order and keeps a trace of each. */
export class SubscriptionClaimEngine {
  steps: SubscriptionClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SubscriptionClaim): number {
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

  evaluateAll(items: SubscriptionClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSubscriptionClaimEngine(): SubscriptionClaimEngine {
  return new SubscriptionClaimEngine(
    [
      new PercentSubscriptionClaimAdjuster(-1.8),
      new MinimumSubscriptionClaimAdjuster(29.7),
      new TieredSubscriptionClaimAdjuster([1625, 1915, 3638], [1.07, 1.19, 0.84]),
      new SubscriptionClaimDiscountOffsetAdjuster(1.13),
    ],
    [],
    3.9,
    5470.1,
  );
}
