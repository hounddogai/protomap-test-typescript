import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionBudget } from "./deflection-budget.js";

/** One step of the deflection budget calculation. */
export interface DeflectionBudgetStep {
  describe(): string;
  adjust(item: DeflectionBudget, value: number): number;
}

export class RoundingDeflectionBudgetAdjuster implements DeflectionBudgetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleDeflectionBudgetAdjuster implements DeflectionBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DeflectionBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDeflectionBudgetAdjuster implements DeflectionBudgetStep {
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

  adjust(item: DeflectionBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDeflectionBudgetAdjuster implements DeflectionBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDeflectionBudgetAdjuster implements DeflectionBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDeflectionBudgetAdjuster implements DeflectionBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the deflection budget steps in order and keeps a trace of each. */
export class DeflectionBudgetEngine {
  steps: DeflectionBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DeflectionBudget): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: DeflectionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDeflectionBudgetEngine(flagsValue: flags.Registry): DeflectionBudgetEngine {
  return new DeflectionBudgetEngine(
    [
      new RoundingDeflectionBudgetAdjuster(0.05),
      new LocaleDeflectionBudgetAdjuster(new Map<string, number>([["north", 0.73]])),
      new FlaggedDeflectionBudgetAdjuster(flagsValue, "deflection-budget-global", -4.8),
      new PercentDeflectionBudgetAdjuster(-6.3),
      new MinimumDeflectionBudgetAdjuster(40.2),
      new CapDeflectionBudgetAdjuster(12109),
    ],
    [],
    3.8,
    95435.7,
  );
}
