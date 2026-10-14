import * as flags from "../../../../kit/flags.js";
import { EnrollmentBudget } from "./enrollment-budget.js";

/** One step of the enrollment budget calculation. */
export interface EnrollmentBudgetStep {
  describe(): string;
  adjust(item: EnrollmentBudget, value: number): number;
}

export class TieredEnrollmentBudgetAdjuster implements EnrollmentBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentEnrollmentBudgetAdjuster implements EnrollmentBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelEnrollmentBudgetAdjuster implements EnrollmentBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: EnrollmentBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class EnrollmentBudgetFrequencyCapOffsetAdjuster implements EnrollmentBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: EnrollmentBudget, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class FlaggedEnrollmentBudgetAdjuster implements EnrollmentBudgetStep {
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

  adjust(item: EnrollmentBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment budget steps in order and keeps a trace of each. */
export class EnrollmentBudgetEngine {
  steps: EnrollmentBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EnrollmentBudget): number {
    let current = item.projectedValue();
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

  evaluateAll(items: EnrollmentBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEnrollmentBudgetEngine(flagsValue: flags.Registry): EnrollmentBudgetEngine {
  return new EnrollmentBudgetEngine(
    [
      new TieredEnrollmentBudgetAdjuster([1189, 2297, 7823], [0.8, 0.94, 1]),
      new PercentEnrollmentBudgetAdjuster(4.9),
      new LabelEnrollmentBudgetAdjuster(
        new Map<string, number>([["retail", 1.09], ["central", 1.31], ["west", 0.79]]),
      ),
      new EnrollmentBudgetFrequencyCapOffsetAdjuster(0.22),
      new FlaggedEnrollmentBudgetAdjuster(flagsValue, "enrollment-budget-default", -9.7),
    ],
    [],
    4,
    70742.6,
  );
}
