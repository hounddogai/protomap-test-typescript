import * as numbers from "../../../../kit/numbers.js";
import { TieredBidRuleBundle } from "./tiered-bid-rule-bundle.js";

/** One step of the tiered bid rule bundle calculation. */
export interface TieredBidRuleBundleFactor {
  describe(): string;
  adjust(item: TieredBidRuleBundle, value: number): number;
}

export class CapTieredBidRuleBundleAdjuster implements TieredBidRuleBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBidRuleBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredBidRuleBundleAdjuster implements TieredBidRuleBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredBidRuleBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredBidRuleBundleAdjuster implements TieredBidRuleBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredBidRuleBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered bid rule bundle steps in order and keeps a trace of each. */
export class TieredBidRuleBundleEngine {
  steps: TieredBidRuleBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBidRuleBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredBidRuleBundle): number {
    let current = item.netLoad();
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

  evaluateAll(items: TieredBidRuleBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredBidRuleBundleEngine(): TieredBidRuleBundleEngine {
  return new TieredBidRuleBundleEngine(
    [
      new CapTieredBidRuleBundleAdjuster(37642),
      new PercentTieredBidRuleBundleAdjuster(22.4),
      new MinimumTieredBidRuleBundleAdjuster(48.8),
    ],
    [],
    1.5,
    25663.6,
  );
}
