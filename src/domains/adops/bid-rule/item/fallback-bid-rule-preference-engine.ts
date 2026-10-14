import * as numbers from "../../../../kit/numbers.js";
import { FallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

/** One step of the fallback bid rule preference calculation. */
export interface FallbackBidRulePreferenceModifier {
  describe(): string;
  adjust(item: FallbackBidRulePreference, value: number): number;
}

export class TieredFallbackBidRulePreferenceAdjuster implements FallbackBidRulePreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBidRulePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackBidRulePreferenceAdjuster implements FallbackBidRulePreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackBidRulePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackBidRulePreferenceAdjuster implements FallbackBidRulePreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackBidRulePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackBidRulePreferenceAdjuster implements FallbackBidRulePreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackBidRulePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FallbackBidRulePreferenceMarginOffsetAdjuster implements FallbackBidRulePreferenceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: FallbackBidRulePreference, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the fallback bid rule preference steps in order and keeps a trace of each. */
export class FallbackBidRulePreferenceEngine {
  steps: FallbackBidRulePreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBidRulePreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackBidRulePreference): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FallbackBidRulePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackBidRulePreferenceEngine(): FallbackBidRulePreferenceEngine {
  return new FallbackBidRulePreferenceEngine(
    [
      new TieredFallbackBidRulePreferenceAdjuster([2676, 3043, 3639], [1.13, 1.05, 1.19]),
      new CapFallbackBidRulePreferenceAdjuster(10023),
      new PercentFallbackBidRulePreferenceAdjuster(-2.9),
      new MinimumFallbackBidRulePreferenceAdjuster(26.3),
      new FallbackBidRulePreferenceMarginOffsetAdjuster(0.47),
    ],
    [],
    3.5,
    93349.4,
  );
}
