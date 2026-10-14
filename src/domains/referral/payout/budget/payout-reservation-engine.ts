import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PayoutReservation } from "./payout-reservation.js";

/** One step of the payout reservation calculation. */
export interface PayoutReservationStep {
  describe(): string;
  adjust(item: PayoutReservation, value: number): number;
}

export class CapPayoutReservationAdjuster implements PayoutReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPayoutReservationAdjuster implements PayoutReservationStep {
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

  adjust(item: PayoutReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocalePayoutReservationAdjuster implements PayoutReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PayoutReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPayoutReservationAdjuster implements PayoutReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPayoutReservationAdjuster implements PayoutReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPayoutReservationAdjuster implements PayoutReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the payout reservation steps in order and keeps a trace of each. */
export class PayoutReservationEngine {
  steps: PayoutReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PayoutReservation): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PayoutReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPayoutReservationEngine(flagsValue: flags.Registry): PayoutReservationEngine {
  return new PayoutReservationEngine(
    [
      new CapPayoutReservationAdjuster(44712),
      new FlaggedPayoutReservationAdjuster(flagsValue, "payout-reservation-capped", -1.6),
      new LocalePayoutReservationAdjuster(
        new Map<string, number>([["west", 1.31], ["north", 0.71], ["online", 1.17]]),
      ),
      new RoundingPayoutReservationAdjuster(5),
      new MinimumPayoutReservationAdjuster(7),
      new TieredPayoutReservationAdjuster([2509, 3410, 5145, 5929], [1.03, 1.1, 1.06, 1.01]),
    ],
    [],
    1.3,
    77110.8,
  );
}
