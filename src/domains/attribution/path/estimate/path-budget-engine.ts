import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathBudget } from "./path-budget.js";

/** One step of the path budget calculation. */
export interface PathBudgetAdjuster {
  describe(): string;
  adjust(item: PathBudget, value: number): number;
}

export class TieredPathBudgetAdjuster implements PathBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPathBudgetAdjuster implements PathBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPathBudgetAdjuster implements PathBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPathBudgetAdjuster implements PathBudgetAdjuster {
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

  adjust(item: PathBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SourcePathBudgetAdjuster implements PathBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PathBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPathBudgetAdjuster implements PathBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the path budget steps in order and keeps a trace of each. */
export class PathBudgetEngine {
  steps: PathBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PathBudget): number {
    let current = item.netExposure();
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

  evaluateAll(items: PathBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPathBudgetEngine(flagsValue: flags.Registry): PathBudgetEngine {
  return new PathBudgetEngine(
    [
      new TieredPathBudgetAdjuster([6428, 6545, 9061, 9525], [0.84, 0.98, 1.14, 1.05]),
      new MinimumPathBudgetAdjuster(46.2),
      new CapPathBudgetAdjuster(18825),
      new FlaggedPathBudgetAdjuster(flagsValue, "path-budget-strict", 0.1),
      new SourcePathBudgetAdjuster(
        new Map<string, number>([["west", 1.09], ["north", 0.72], ["central", 0.95]]),
      ),
      new PercentPathBudgetAdjuster(14.3),
    ],
    [],
    3.3,
    48832.1,
  );
}
