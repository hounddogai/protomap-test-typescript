import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalWaitBudget } from "./global-wait-budget.js";

/** One step of the global wait budget calculation. */
export interface GlobalWaitBudgetAdjuster {
  describe(): string;
  adjust(item: GlobalWaitBudget, value: number): number;
}

export class LabelGlobalWaitBudgetAdjuster implements GlobalWaitBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalWaitBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedGlobalWaitBudgetAdjuster implements GlobalWaitBudgetAdjuster {
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

  adjust(item: GlobalWaitBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentGlobalWaitBudgetAdjuster implements GlobalWaitBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalWaitBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalWaitBudgetAdjuster implements GlobalWaitBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalWaitBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalWaitBudgetWindowDaysOffsetAdjuster implements GlobalWaitBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: GlobalWaitBudget, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class CapGlobalWaitBudgetAdjuster implements GlobalWaitBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalWaitBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global wait budget steps in order and keeps a trace of each. */
export class GlobalWaitBudgetEngine {
  steps: GlobalWaitBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalWaitBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalWaitBudget): number {
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

  evaluateAll(items: GlobalWaitBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalWaitBudgetEngine(flagsValue: flags.Registry): GlobalWaitBudgetEngine {
  return new GlobalWaitBudgetEngine(
    [
      new LabelGlobalWaitBudgetAdjuster(
        new Map<string, number>([["retail", 1.18], ["online", 1.05], ["central", 0.88]]),
      ),
      new FlaggedGlobalWaitBudgetAdjuster(flagsValue, "global-wait-budget-tiered", 6.2),
      new PercentGlobalWaitBudgetAdjuster(14.8),
      new TieredGlobalWaitBudgetAdjuster([982, 3129, 6365], [1.1, 1.16, 0.86]),
      new GlobalWaitBudgetWindowDaysOffsetAdjuster(0.98),
      new CapGlobalWaitBudgetAdjuster(24226),
    ],
    [],
    0.7,
    29859,
  );
}
