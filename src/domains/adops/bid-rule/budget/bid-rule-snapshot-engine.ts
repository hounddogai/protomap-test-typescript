import * as numbers from "../../../../kit/numbers.js";
import { BidRuleSnapshot } from "./bid-rule-snapshot.js";

/** One step of the bid rule snapshot calculation. */
export interface BidRuleSnapshotAdjuster {
  describe(): string;
  adjust(item: BidRuleSnapshot, value: number): number;
}

export class BidRuleSnapshotBidOffsetAdjuster implements BidRuleSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: BidRuleSnapshot, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class RoundingBidRuleSnapshotAdjuster implements BidRuleSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBidRuleSnapshotAdjuster implements BidRuleSnapshotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleBidRuleSnapshotAdjuster implements BidRuleSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BidRuleSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBidRuleSnapshotAdjuster implements BidRuleSnapshotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the bid rule snapshot steps in order and keeps a trace of each. */
export class BidRuleSnapshotEngine {
  steps: BidRuleSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleSnapshot): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BidRuleSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleSnapshotEngine(): BidRuleSnapshotEngine {
  return new BidRuleSnapshotEngine(
    [
      new BidRuleSnapshotBidOffsetAdjuster(0.11),
      new RoundingBidRuleSnapshotAdjuster(5),
      new MinimumBidRuleSnapshotAdjuster(2.2),
      new LocaleBidRuleSnapshotAdjuster(new Map<string, number>([["north", 1.02], ["retail", 1.19]])),
      new TieredBidRuleSnapshotAdjuster([2598, 6317, 8863, 8952], [1.11, 0.85, 0.94, 0.89]),
    ],
    [],
    2.7,
    88095.9,
  );
}
