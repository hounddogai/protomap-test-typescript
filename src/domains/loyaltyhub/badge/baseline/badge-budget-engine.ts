import * as flags from "../../../../kit/flags.js";
import { BadgeBudget } from "./badge-budget.js";

/** One step of the badge budget calculation. */
export interface BadgeBudgetModifier {
  describe(): string;
  adjust(item: BadgeBudget, value: number): number;
}

export class TieredBadgeBudgetAdjuster implements BadgeBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBadgeBudgetAdjuster implements BadgeBudgetModifier {
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

  adjust(item: BadgeBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBadgeBudgetAdjuster implements BadgeBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelBadgeBudgetAdjuster implements BadgeBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BadgeBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBadgeBudgetAdjuster implements BadgeBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the badge budget steps in order and keeps a trace of each. */
export class BadgeBudgetEngine {
  steps: BadgeBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgeBudget): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: BadgeBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgeBudgetEngine(flagsValue: flags.Registry): BadgeBudgetEngine {
  return new BadgeBudgetEngine(
    [
      new TieredBadgeBudgetAdjuster([2724, 9708], [1.12, 0.99]),
      new FlaggedBadgeBudgetAdjuster(flagsValue, "badge-budget-default", -8.5),
      new PercentBadgeBudgetAdjuster(4.3),
      new LabelBadgeBudgetAdjuster(new Map<string, number>([["south", 0.88]])),
      new MinimumBadgeBudgetAdjuster(0.6),
    ],
    [],
    0.1,
    91161.2,
  );
}
