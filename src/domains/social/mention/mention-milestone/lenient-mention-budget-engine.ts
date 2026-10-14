import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientMentionBudget } from "./lenient-mention-budget.js";

/** One step of the lenient mention budget calculation. */
export interface LenientMentionBudgetFactor {
  describe(): string;
  adjust(item: LenientMentionBudget, value: number): number;
}

export class TieredLenientMentionBudgetAdjuster implements LenientMentionBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientMentionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLenientMentionBudgetAdjuster implements LenientMentionBudgetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientMentionBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLenientMentionBudgetAdjuster implements LenientMentionBudgetFactor {
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

  adjust(item: LenientMentionBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientMentionBudgetAdjuster implements LenientMentionBudgetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientMentionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient mention budget steps in order and keeps a trace of each. */
export class LenientMentionBudgetEngine {
  steps: LenientMentionBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientMentionBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientMentionBudget): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LenientMentionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientMentionBudgetEngine(flagsValue: flags.Registry): LenientMentionBudgetEngine {
  return new LenientMentionBudgetEngine(
    [
      new TieredLenientMentionBudgetAdjuster([1162, 2876, 8738, 9633], [0.81, 0.85, 0.94, 0.99]),
      new CapLenientMentionBudgetAdjuster(13398),
      new FlaggedLenientMentionBudgetAdjuster(flagsValue, "lenient-mention-budget-lenient", -8.3),
      new PercentLenientMentionBudgetAdjuster(11),
    ],
    [],
    5,
    37226.4,
  );
}
