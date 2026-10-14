import * as numbers from "../../../../kit/numbers.js";
import { StrictBadgeReservation } from "./strict-badge-reservation.js";

/** One step of the strict badge reservation calculation. */
export interface StrictBadgeReservationStep {
  describe(): string;
  adjust(item: StrictBadgeReservation, value: number): number;
}

export class StrictBadgeReservationWeightOffsetAdjuster implements StrictBadgeReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: StrictBadgeReservation, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class CapStrictBadgeReservationAdjuster implements StrictBadgeReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictBadgeReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictBadgeReservationAdjuster implements StrictBadgeReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictBadgeReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStrictBadgeReservationAdjuster implements StrictBadgeReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictBadgeReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStrictBadgeReservationAdjuster implements StrictBadgeReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictBadgeReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleStrictBadgeReservationAdjuster implements StrictBadgeReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: StrictBadgeReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict badge reservation steps in order and keeps a trace of each. */
export class StrictBadgeReservationEngine {
  steps: StrictBadgeReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBadgeReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictBadgeReservation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictBadgeReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictBadgeReservationEngine(): StrictBadgeReservationEngine {
  return new StrictBadgeReservationEngine(
    [
      new StrictBadgeReservationWeightOffsetAdjuster(0.17),
      new CapStrictBadgeReservationAdjuster(34893),
      new RoundingStrictBadgeReservationAdjuster(0.05),
      new TieredStrictBadgeReservationAdjuster([642, 2976, 9162], [1.15, 1.11, 1.09]),
      new MinimumStrictBadgeReservationAdjuster(1.9),
      new LocaleStrictBadgeReservationAdjuster(
        new Map<string, number>([["north", 1.01], ["retail", 0.86], ["south", 0.8]]),
      ),
    ],
    [],
    1.7,
    40910.1,
  );
}
