import * as flags from "../../../../kit/flags.js";
import { CreditGroup } from "./credit-group.js";

/** One step of the credit group calculation. */
export interface CreditGroupAdjuster {
  describe(): string;
  adjust(item: CreditGroup, value: number): number;
}

export class MinimumCreditGroupAdjuster implements CreditGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleCreditGroupAdjuster implements CreditGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CreditGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCreditGroupAdjuster implements CreditGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedCreditGroupAdjuster implements CreditGroupAdjuster {
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

  adjust(item: CreditGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CreditGroupBudgetOffsetAdjuster implements CreditGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: CreditGroup, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the credit group steps in order and keeps a trace of each. */
export class CreditGroupEngine {
  steps: CreditGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreditGroup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CreditGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreditGroupEngine(flagsValue: flags.Registry): CreditGroupEngine {
  return new CreditGroupEngine(
    [
      new MinimumCreditGroupAdjuster(12.6),
      new LocaleCreditGroupAdjuster(new Map<string, number>([["west", 0.76], ["south", 0.83]])),
      new CapCreditGroupAdjuster(12800),
      new FlaggedCreditGroupAdjuster(flagsValue, "credit-group-scheduled", -2),
      new CreditGroupBudgetOffsetAdjuster(1.09),
    ],
    [],
    1.4,
    74597,
  );
}
