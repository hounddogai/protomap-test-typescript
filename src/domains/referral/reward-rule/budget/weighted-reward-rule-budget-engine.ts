import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedRewardRuleBudget } from "./weighted-reward-rule-budget.js";

/** One step of the weighted reward rule budget calculation. */
export interface WeightedRewardRuleBudgetFactor {
  describe(): string;
  adjust(item: WeightedRewardRuleBudget, value: number): number;
}

export class FlaggedWeightedRewardRuleBudgetAdjuster implements WeightedRewardRuleBudgetFactor {
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

  adjust(item: WeightedRewardRuleBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedRewardRuleBudgetAdjuster implements WeightedRewardRuleBudgetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedRewardRuleBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedRewardRuleBudgetAdjuster implements WeightedRewardRuleBudgetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRewardRuleBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryWeightedRewardRuleBudgetAdjuster implements WeightedRewardRuleBudgetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: WeightedRewardRuleBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted reward rule budget steps in order and keeps a trace of each. */
export class WeightedRewardRuleBudgetEngine {
  steps: WeightedRewardRuleBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRewardRuleBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedRewardRuleBudget): number {
    let current = item.netValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: WeightedRewardRuleBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedRewardRuleBudgetEngine(flagsValue: flags.Registry): WeightedRewardRuleBudgetEngine {
  return new WeightedRewardRuleBudgetEngine(
    [
      new FlaggedWeightedRewardRuleBudgetAdjuster(flagsValue, "weighted-reward-rule-budget-regional", 8.3),
      new MinimumWeightedRewardRuleBudgetAdjuster(32.3),
      new RoundingWeightedRewardRuleBudgetAdjuster(5),
      new CountryWeightedRewardRuleBudgetAdjuster(new Map<string, number>([["north", 0.81], ["west", 1.03]])),
    ],
    [],
    2.5,
    55077.3,
  );
}
