import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

/** One step of the adaptive exit rule bundle calculation. */
export interface AdaptiveExitRuleBundleFactor {
  describe(): string;
  adjust(item: AdaptiveExitRuleBundle, value: number): number;
}

export class AdaptiveExitRuleBundleAttemptsOffsetAdjuster implements AdaptiveExitRuleBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: AdaptiveExitRuleBundle, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class TieredAdaptiveExitRuleBundleAdjuster implements AdaptiveExitRuleBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveExitRuleBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveExitRuleBundleAdjuster implements AdaptiveExitRuleBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveExitRuleBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameAdaptiveExitRuleBundleAdjuster implements AdaptiveExitRuleBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveExitRuleBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive exit rule bundle steps in order and keeps a trace of each. */
export class AdaptiveExitRuleBundleEngine {
  steps: AdaptiveExitRuleBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveExitRuleBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveExitRuleBundle): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: AdaptiveExitRuleBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveExitRuleBundleEngine(): AdaptiveExitRuleBundleEngine {
  return new AdaptiveExitRuleBundleEngine(
    [
      new AdaptiveExitRuleBundleAttemptsOffsetAdjuster(0.12),
      new TieredAdaptiveExitRuleBundleAdjuster([127, 2024, 5407, 9397], [1, 1.14, 1.05, 1.07]),
      new CapAdaptiveExitRuleBundleAdjuster(14517),
      new NameAdaptiveExitRuleBundleAdjuster(new Map<string, number>([["online", 0.85]])),
    ],
    [],
    1.5,
    44759,
  );
}
