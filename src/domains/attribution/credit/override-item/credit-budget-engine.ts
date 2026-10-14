import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditBudget } from "./credit-budget.js";

/** One step of the credit budget calculation. */
export interface CreditBudgetModifier {
  describe(): string;
  adjust(item: CreditBudget, value: number): number;
}

export class RoundingCreditBudgetAdjuster implements CreditBudgetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameCreditBudgetAdjuster implements CreditBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreditBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedCreditBudgetAdjuster implements CreditBudgetModifier {
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

  adjust(item: CreditBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit budget steps in order and keeps a trace of each. */
export class CreditBudgetEngine {
  steps: CreditBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditBudget): number {
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

  evaluateAll(items: CreditBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditBudgetEngine(flagsValue: flags.Registry): CreditBudgetEngine {
  return new CreditBudgetEngine(
    [
      new RoundingCreditBudgetAdjuster(0.5),
      new NameCreditBudgetAdjuster(new Map<string, number>([["east", 0.97], ["central", 0.83], ["west", 0.88]])),
      new FlaggedCreditBudgetAdjuster(flagsValue, "credit-budget-global", -2.8),
    ],
    [],
    2.3,
    12275.4,
  );
}
