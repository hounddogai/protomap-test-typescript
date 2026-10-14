import * as numbers from "../../../../kit/numbers.js";
import { CreditSchedule } from "./credit-schedule.js";

/** One step of the credit schedule calculation. */
export interface CreditScheduleAdjuster {
  describe(): string;
  adjust(item: CreditSchedule, value: number): number;
}

export class TieredCreditScheduleAdjuster implements CreditScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCreditScheduleAdjuster implements CreditScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreditScheduleAdjuster implements CreditScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleCreditScheduleAdjuster implements CreditScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CreditSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumCreditScheduleAdjuster implements CreditScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCreditScheduleAdjuster implements CreditScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the credit schedule steps in order and keeps a trace of each. */
export class CreditScheduleEngine {
  steps: CreditScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditSchedule): number {
    let current = item.netVolume();
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

  evaluateAll(items: CreditSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditScheduleEngine(): CreditScheduleEngine {
  return new CreditScheduleEngine(
    [
      new TieredCreditScheduleAdjuster([2322, 4565, 5906], [0.85, 1.02, 1.07]),
      new PercentCreditScheduleAdjuster(10.7),
      new RoundingCreditScheduleAdjuster(1),
      new TitleCreditScheduleAdjuster(new Map<string, number>([["east", 1.11], ["south", 1.2]])),
      new MinimumCreditScheduleAdjuster(38.3),
      new CapCreditScheduleAdjuster(5097),
    ],
    [],
    0.4,
    53436.2,
  );
}
