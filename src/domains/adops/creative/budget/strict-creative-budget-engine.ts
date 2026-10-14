import * as flags from "../../../../kit/flags.js";
import { StrictCreativeBudget } from "./strict-creative-budget.js";

/** One step of the strict creative budget calculation. */
export interface StrictCreativeBudgetModifier {
  describe(): string;
  adjust(item: StrictCreativeBudget, value: number): number;
}

export class ChannelStrictCreativeBudgetAdjuster implements StrictCreativeBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictCreativeBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStrictCreativeBudgetAdjuster implements StrictCreativeBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCreativeBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StrictCreativeBudgetPriorityOffsetAdjuster implements StrictCreativeBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: StrictCreativeBudget, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedStrictCreativeBudgetAdjuster implements StrictCreativeBudgetModifier {
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

  adjust(item: StrictCreativeBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictCreativeBudgetAdjuster implements StrictCreativeBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictCreativeBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentStrictCreativeBudgetAdjuster implements StrictCreativeBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictCreativeBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict creative budget steps in order and keeps a trace of each. */
export class StrictCreativeBudgetEngine {
  steps: StrictCreativeBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCreativeBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictCreativeBudget): number {
    let current = item.netExposure();
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

  evaluateAll(items: StrictCreativeBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictCreativeBudgetEngine(flagsValue: flags.Registry): StrictCreativeBudgetEngine {
  return new StrictCreativeBudgetEngine(
    [
      new ChannelStrictCreativeBudgetAdjuster(new Map<string, number>([["south", 1.04], ["central", 1.34]])),
      new CapStrictCreativeBudgetAdjuster(17795),
      new StrictCreativeBudgetPriorityOffsetAdjuster(0.52),
      new FlaggedStrictCreativeBudgetAdjuster(flagsValue, "strict-creative-budget-rolling", 4.9),
      new MinimumStrictCreativeBudgetAdjuster(0.7),
      new PercentStrictCreativeBudgetAdjuster(-24.1),
    ],
    [],
    2.1,
    56011.2,
  );
}
