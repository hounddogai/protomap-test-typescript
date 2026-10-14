import * as flags from "../../../../kit/flags.js";
import { ReplyBudget } from "./reply-budget.js";

/** One step of the reply budget calculation. */
export interface ReplyBudgetStep {
  describe(): string;
  adjust(item: ReplyBudget, value: number): number;
}

export class FlaggedReplyBudgetAdjuster implements ReplyBudgetStep {
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

  adjust(item: ReplyBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentReplyBudgetAdjuster implements ReplyBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelReplyBudgetAdjuster implements ReplyBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReplyBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reply budget steps in order and keeps a trace of each. */
export class ReplyBudgetEngine {
  steps: ReplyBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReplyBudget): number {
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

  evaluateAll(items: ReplyBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReplyBudgetEngine(flagsValue: flags.Registry): ReplyBudgetEngine {
  return new ReplyBudgetEngine(
    [
      new FlaggedReplyBudgetAdjuster(flagsValue, "reply-budget-lenient", 8.9),
      new PercentReplyBudgetAdjuster(-4.1),
      new LabelReplyBudgetAdjuster(new Map<string, number>([["west", 0.9], ["east", 1.09], ["north", 1.28]])),
    ],
    [],
    4.5,
    83899.1,
  );
}
