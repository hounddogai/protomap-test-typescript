import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BranchBudget } from "./branch-budget.js";

/** One step of the branch budget calculation. */
export interface BranchBudgetAdjuster {
  describe(): string;
  adjust(item: BranchBudget, value: number): number;
}

export class UnitBranchBudgetAdjuster implements BranchBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BranchBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBranchBudgetAdjuster implements BranchBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BranchBudgetCreatedAtOffsetAdjuster implements BranchBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: BranchBudget, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class TieredBranchBudgetAdjuster implements BranchBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBranchBudgetAdjuster implements BranchBudgetAdjuster {
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

  adjust(item: BranchBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the branch budget steps in order and keeps a trace of each. */
export class BranchBudgetEngine {
  steps: BranchBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchBudget): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BranchBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchBudgetEngine(flagsValue: flags.Registry): BranchBudgetEngine {
  return new BranchBudgetEngine(
    [
      new UnitBranchBudgetAdjuster(new Map<string, number>([["online", 1.14]])),
      new PercentBranchBudgetAdjuster(-4.8),
      new BranchBudgetCreatedAtOffsetAdjuster(1.82),
      new TieredBranchBudgetAdjuster([8259, 8400, 9536], [1.08, 1.14, 0.98]),
      new FlaggedBranchBudgetAdjuster(flagsValue, "branch-budget-pending", 0.8),
    ],
    [],
    0,
    59622.2,
  );
}
