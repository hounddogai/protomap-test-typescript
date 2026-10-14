import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveCreditBudget } from "./adaptive-credit-budget.js";

/** One step of the adaptive credit budget calculation. */
export interface AdaptiveCreditBudgetModifier {
  describe(): string;
  adjust(item: AdaptiveCreditBudget, value: number): number;
}

export class TieredAdaptiveCreditBudgetAdjuster implements AdaptiveCreditBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveCreditBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentAdaptiveCreditBudgetAdjuster implements AdaptiveCreditBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveCreditBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveCreditBudgetCostOffsetAdjuster implements AdaptiveCreditBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: AdaptiveCreditBudget, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumAdaptiveCreditBudgetAdjuster implements AdaptiveCreditBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveCreditBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptiveCreditBudgetAdjuster implements AdaptiveCreditBudgetModifier {
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

  adjust(item: AdaptiveCreditBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive credit budget steps in order and keeps a trace of each. */
export class AdaptiveCreditBudgetEngine {
  steps: AdaptiveCreditBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCreditBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveCreditBudget): number {
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

  evaluateAll(items: AdaptiveCreditBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveCreditBudgetEngine(flagsValue: flags.Registry): AdaptiveCreditBudgetEngine {
  return new AdaptiveCreditBudgetEngine(
    [
      new TieredAdaptiveCreditBudgetAdjuster([2184, 5228, 7070], [0.8, 0.95, 0.96]),
      new PercentAdaptiveCreditBudgetAdjuster(-0.5),
      new AdaptiveCreditBudgetCostOffsetAdjuster(1.91),
      new MinimumAdaptiveCreditBudgetAdjuster(16.9),
      new FlaggedAdaptiveCreditBudgetAdjuster(flagsValue, "adaptive-credit-budget-regional", 0.5),
    ],
    [],
    4.8,
    97996.1,
  );
}
