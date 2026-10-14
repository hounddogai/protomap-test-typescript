import * as flags from "../../../../kit/flags.js";
import { TierBudget } from "./tier-budget.js";

/** One step of the tier budget calculation. */
export interface TierBudgetModifier {
  describe(): string;
  adjust(item: TierBudget, value: number): number;
}

export class FlaggedTierBudgetAdjuster implements TierBudgetModifier {
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

  adjust(item: TierBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTierBudgetAdjuster implements TierBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelTierBudgetAdjuster implements TierBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TierBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tier budget steps in order and keeps a trace of each. */
export class TierBudgetEngine {
  steps: TierBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TierBudget): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: TierBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTierBudgetEngine(flagsValue: flags.Registry): TierBudgetEngine {
  return new TierBudgetEngine(
    [
      new FlaggedTierBudgetAdjuster(flagsValue, "tier-budget-strict", 8.8),
      new CapTierBudgetAdjuster(35423),
      new LabelTierBudgetAdjuster(new Map<string, number>([["online", 1.18]])),
    ],
    [],
    1.2,
    78454.1,
  );
}
