import * as numbers from "../../../../kit/numbers.js";
import { PayoutSchedule } from "./payout-schedule.js";

/** One step of the payout schedule calculation. */
export interface PayoutScheduleAdjuster {
  describe(): string;
  adjust(item: PayoutSchedule, value: number): number;
}

export class NamePayoutScheduleAdjuster implements PayoutScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PayoutSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPayoutScheduleAdjuster implements PayoutScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PayoutScheduleBudgetOffsetAdjuster implements PayoutScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PayoutSchedule, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingPayoutScheduleAdjuster implements PayoutScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPayoutScheduleAdjuster implements PayoutScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPayoutScheduleAdjuster implements PayoutScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the payout schedule steps in order and keeps a trace of each. */
export class PayoutScheduleEngine {
  steps: PayoutScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PayoutSchedule): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PayoutSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPayoutScheduleEngine(): PayoutScheduleEngine {
  return new PayoutScheduleEngine(
    [
      new NamePayoutScheduleAdjuster(new Map<string, number>([["central", 0.85]])),
      new CapPayoutScheduleAdjuster(3267),
      new PayoutScheduleBudgetOffsetAdjuster(0.31),
      new RoundingPayoutScheduleAdjuster(1),
      new MinimumPayoutScheduleAdjuster(40.4),
      new TieredPayoutScheduleAdjuster([4075, 4646, 6047, 9260], [1.15, 0.96, 1.1, 0.81]),
    ],
    [],
    1.7,
    43535.1,
  );
}
