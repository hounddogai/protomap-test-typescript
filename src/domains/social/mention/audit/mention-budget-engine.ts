import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionBudget } from "./mention-budget.js";

/** One step of the mention budget calculation. */
export interface MentionBudgetFactor {
  describe(): string;
  adjust(item: MentionBudget, value: number): number;
}

export class FlaggedMentionBudgetAdjuster implements MentionBudgetFactor {
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

  adjust(item: MentionBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MentionBudgetQuantityOffsetAdjuster implements MentionBudgetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: MentionBudget, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredMentionBudgetAdjuster implements MentionBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentMentionBudgetAdjuster implements MentionBudgetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapMentionBudgetAdjuster implements MentionBudgetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the mention budget steps in order and keeps a trace of each. */
export class MentionBudgetEngine {
  steps: MentionBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionBudget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: MentionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionBudgetEngine(flagsValue: flags.Registry): MentionBudgetEngine {
  return new MentionBudgetEngine(
    [
      new FlaggedMentionBudgetAdjuster(flagsValue, "mention-budget-manual", -4.2),
      new MentionBudgetQuantityOffsetAdjuster(1.42),
      new TieredMentionBudgetAdjuster([3646, 5204], [1.07, 0.95]),
      new PercentMentionBudgetAdjuster(-12.4),
      new CapMentionBudgetAdjuster(27216),
    ],
    [],
    1,
    52909,
  );
}
