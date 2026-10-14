import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictReplyBudget } from "./strict-reply-budget.js";

/** One step of the strict reply budget calculation. */
export interface StrictReplyBudgetModifier {
  describe(): string;
  adjust(item: StrictReplyBudget, value: number): number;
}

export class RegionStrictReplyBudgetAdjuster implements StrictReplyBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: StrictReplyBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictReplyBudgetAdjuster implements StrictReplyBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictReplyBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredStrictReplyBudgetAdjuster implements StrictReplyBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictReplyBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedStrictReplyBudgetAdjuster implements StrictReplyBudgetModifier {
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

  adjust(item: StrictReplyBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict reply budget steps in order and keeps a trace of each. */
export class StrictReplyBudgetEngine {
  steps: StrictReplyBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictReplyBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictReplyBudget): number {
    let current = item.weightedValue();
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

  evaluateAll(items: StrictReplyBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictReplyBudgetEngine(flagsValue: flags.Registry): StrictReplyBudgetEngine {
  return new StrictReplyBudgetEngine(
    [
      new RegionStrictReplyBudgetAdjuster(
        new Map<string, number>([["west", 0.71], ["retail", 0.85], ["central", 1.11]]),
      ),
      new MinimumStrictReplyBudgetAdjuster(44.2),
      new TieredStrictReplyBudgetAdjuster([5735, 8416, 9690], [0.93, 0.92, 0.94]),
      new FlaggedStrictReplyBudgetAdjuster(flagsValue, "strict-reply-budget-rolling", -4.2),
    ],
    [],
    4.5,
    38579.9,
  );
}
