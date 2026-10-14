import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FrequencyBudget } from "./frequency-budget.js";

/** One step of the frequency budget calculation. */
export interface FrequencyBudgetModifier {
  describe(): string;
  adjust(item: FrequencyBudget, value: number): number;
}

export class MinimumFrequencyBudgetAdjuster implements FrequencyBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFrequencyBudgetAdjuster implements FrequencyBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencyBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFrequencyBudgetAdjuster implements FrequencyBudgetModifier {
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

  adjust(item: FrequencyBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFrequencyBudgetAdjuster implements FrequencyBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the frequency budget steps in order and keeps a trace of each. */
export class FrequencyBudgetEngine {
  steps: FrequencyBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FrequencyBudget): number {
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

  evaluateAll(items: FrequencyBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFrequencyBudgetEngine(flagsValue: flags.Registry): FrequencyBudgetEngine {
  return new FrequencyBudgetEngine(
    [
      new MinimumFrequencyBudgetAdjuster(18.1),
      new TieredFrequencyBudgetAdjuster([2348, 7154], [1.04, 1.15]),
      new FlaggedFrequencyBudgetAdjuster(flagsValue, "frequency-budget-batched", 8.8),
      new PercentFrequencyBudgetAdjuster(10),
    ],
    [],
    1,
    21940.5,
  );
}
