import * as numbers from "../../../../kit/numbers.js";
import { BidRuleBundle } from "./bid-rule-bundle.js";

/** One step of the bid rule bundle calculation. */
export interface BidRuleBundleAdjuster {
  describe(): string;
  adjust(item: BidRuleBundle, value: number): number;
}

export class TieredBidRuleBundleAdjuster implements BidRuleBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBidRuleBundleAdjuster implements BidRuleBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBidRuleBundleAdjuster implements BidRuleBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BidRuleBundleScoreOffsetAdjuster implements BidRuleBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: BidRuleBundle, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the bid rule bundle steps in order and keeps a trace of each. */
export class BidRuleBundleEngine {
  steps: BidRuleBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleBundle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BidRuleBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleBundleEngine(): BidRuleBundleEngine {
  return new BidRuleBundleEngine(
    [
      new TieredBidRuleBundleAdjuster([1697, 4585, 8866, 8981], [0.99, 0.96, 1.03, 1.07]),
      new CapBidRuleBundleAdjuster(12637),
      new MinimumBidRuleBundleAdjuster(3.4),
      new BidRuleBundleScoreOffsetAdjuster(1.32),
    ],
    [],
    1.1,
    87799.4,
  );
}
