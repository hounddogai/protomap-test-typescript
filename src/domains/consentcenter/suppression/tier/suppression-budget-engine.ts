import * as flags from "../../../../kit/flags.js";
import { SuppressionBudget } from "./suppression-budget.js";

/** One step of the suppression budget calculation. */
export interface SuppressionBudgetAdjuster {
  describe(): string;
  adjust(item: SuppressionBudget, value: number): number;
}

export class TieredSuppressionBudgetAdjuster implements SuppressionBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SuppressionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSuppressionBudgetAdjuster implements SuppressionBudgetAdjuster {
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

  adjust(item: SuppressionBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SuppressionBudgetBudgetOffsetAdjuster implements SuppressionBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: SuppressionBudget, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentSuppressionBudgetAdjuster implements SuppressionBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression budget steps in order and keeps a trace of each. */
export class SuppressionBudgetEngine {
  steps: SuppressionBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SuppressionBudget): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SuppressionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSuppressionBudgetEngine(flagsValue: flags.Registry): SuppressionBudgetEngine {
  return new SuppressionBudgetEngine(
    [
      new TieredSuppressionBudgetAdjuster([831, 4883, 8473, 8505], [1.06, 0.95, 0.84, 0.95]),
      new FlaggedSuppressionBudgetAdjuster(flagsValue, "suppression-budget-default", 1.5),
      new SuppressionBudgetBudgetOffsetAdjuster(1.54),
      new PercentSuppressionBudgetAdjuster(11.7),
    ],
    [],
    1.7,
    59224.1,
  );
}
