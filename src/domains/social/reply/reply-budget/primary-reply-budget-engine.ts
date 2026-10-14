import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryReplyBudget } from "./primary-reply-budget.js";

/** One step of the primary reply budget calculation. */
export interface PrimaryReplyBudgetAdjuster {
  describe(): string;
  adjust(item: PrimaryReplyBudget, value: number): number;
}

export class MinimumPrimaryReplyBudgetAdjuster implements PrimaryReplyBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryReplyBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPrimaryReplyBudgetAdjuster implements PrimaryReplyBudgetAdjuster {
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

  adjust(item: PrimaryReplyBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryReplyBudgetImpressionsOffsetAdjuster implements PrimaryReplyBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: PrimaryReplyBudget, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingPrimaryReplyBudgetAdjuster implements PrimaryReplyBudgetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryReplyBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary reply budget steps in order and keeps a trace of each. */
export class PrimaryReplyBudgetEngine {
  steps: PrimaryReplyBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryReplyBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryReplyBudget): number {
    let current = item.netLoad();
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

  evaluateAll(items: PrimaryReplyBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryReplyBudgetEngine(flagsValue: flags.Registry): PrimaryReplyBudgetEngine {
  return new PrimaryReplyBudgetEngine(
    [
      new MinimumPrimaryReplyBudgetAdjuster(37.5),
      new FlaggedPrimaryReplyBudgetAdjuster(flagsValue, "primary-reply-budget-strict", -2.5),
      new PrimaryReplyBudgetImpressionsOffsetAdjuster(1.38),
      new RoundingPrimaryReplyBudgetAdjuster(1),
    ],
    [],
    4.3,
    13583.3,
  );
}
