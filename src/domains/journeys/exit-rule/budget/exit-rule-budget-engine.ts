import * as flags from "../../../../kit/flags.js";
import { ExitRuleBudget } from "./exit-rule-budget.js";

/** One step of the exit rule budget calculation. */
export interface ExitRuleBudgetAdjuster {
  describe(): string;
  adjust(item: ExitRuleBudget, value: number): number;
}

export class TieredExitRuleBudgetAdjuster implements ExitRuleBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ExitRuleBudgetQuantityOffsetAdjuster implements ExitRuleBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ExitRuleBudget, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedExitRuleBudgetAdjuster implements ExitRuleBudgetAdjuster {
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

  adjust(item: ExitRuleBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule budget steps in order and keeps a trace of each. */
export class ExitRuleBudgetEngine {
  steps: ExitRuleBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleBudget): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ExitRuleBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleBudgetEngine(flagsValue: flags.Registry): ExitRuleBudgetEngine {
  return new ExitRuleBudgetEngine(
    [
      new TieredExitRuleBudgetAdjuster([1479, 3323, 8319], [1.11, 1.16, 0.92]),
      new ExitRuleBudgetQuantityOffsetAdjuster(1.88),
      new FlaggedExitRuleBudgetAdjuster(flagsValue, "exit-rule-budget-strict", 1.5),
    ],
    [],
    0.5,
    59576.9,
  );
}
