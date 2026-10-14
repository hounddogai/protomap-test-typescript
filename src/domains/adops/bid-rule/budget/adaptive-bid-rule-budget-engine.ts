import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveBidRuleBudget } from "./adaptive-bid-rule-budget.js";

/** One step of the adaptive bid rule budget calculation. */
export interface AdaptiveBidRuleBudgetFactor {
  describe(): string;
  adjust(item: AdaptiveBidRuleBudget, value: number): number;
}

export class PercentAdaptiveBidRuleBudgetAdjuster implements AdaptiveBidRuleBudgetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveBidRuleBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveBidRuleBudgetAdjuster implements AdaptiveBidRuleBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveBidRuleBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveBidRuleBudgetAdjuster implements AdaptiveBidRuleBudgetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveBidRuleBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveBidRuleBudgetAdjuster implements AdaptiveBidRuleBudgetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveBidRuleBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingAdaptiveBidRuleBudgetAdjuster implements AdaptiveBidRuleBudgetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveBidRuleBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveBidRuleBudgetAdjuster implements AdaptiveBidRuleBudgetFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: AdaptiveBidRuleBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive bid rule budget steps in order and keeps a trace of each. */
export class AdaptiveBidRuleBudgetEngine {
  steps: AdaptiveBidRuleBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveBidRuleBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveBidRuleBudget): number {
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

  evaluateAll(items: AdaptiveBidRuleBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveBidRuleBudgetEngine(flagsValue: flags.Registry): AdaptiveBidRuleBudgetEngine {
  return new AdaptiveBidRuleBudgetEngine(
    [
      new PercentAdaptiveBidRuleBudgetAdjuster(-14.1),
      new TieredAdaptiveBidRuleBudgetAdjuster([2341, 6721, 7921, 8939], [0.84, 0.85, 1.02, 0.83]),
      new CapAdaptiveBidRuleBudgetAdjuster(5808),
      new MinimumAdaptiveBidRuleBudgetAdjuster(19.4),
      new RoundingAdaptiveBidRuleBudgetAdjuster(0.1),
      new FlaggedAdaptiveBidRuleBudgetAdjuster(flagsValue, "adaptive-bid-rule-budget-tiered", -3.2),
    ],
    [],
    0.1,
    89700.1,
  );
}
