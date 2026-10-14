import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditBaseline } from "./credit-baseline.js";

/** One step of the credit baseline calculation. */
export interface CreditBaselineAdjuster {
  describe(): string;
  adjust(item: CreditBaseline, value: number): number;
}

export class RoundingCreditBaselineAdjuster implements CreditBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitCreditBaselineAdjuster implements CreditBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: CreditBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCreditBaselineAdjuster implements CreditBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCreditBaselineAdjuster implements CreditBaselineAdjuster {
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

  adjust(item: CreditBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CreditBaselineCreatedAtOffsetAdjuster implements CreditBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: CreditBaseline, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the credit baseline steps in order and keeps a trace of each. */
export class CreditBaselineEngine {
  steps: CreditBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreditBaseline): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: CreditBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreditBaselineEngine(flagsValue: flags.Registry): CreditBaselineEngine {
  return new CreditBaselineEngine(
    [
      new RoundingCreditBaselineAdjuster(5),
      new UnitCreditBaselineAdjuster(new Map<string, number>([["west", 1.21], ["north", 1], ["east", 1.05]])),
      new PercentCreditBaselineAdjuster(18.2),
      new FlaggedCreditBaselineAdjuster(flagsValue, "credit-baseline-legacy", -5.7),
      new CreditBaselineCreatedAtOffsetAdjuster(0.93),
    ],
    [],
    4.1,
    69717,
  );
}
