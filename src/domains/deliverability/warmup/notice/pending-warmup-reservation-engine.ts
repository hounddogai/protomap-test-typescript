import * as numbers from "../../../../kit/numbers.js";
import { PendingWarmupReservation } from "./pending-warmup-reservation.js";

/** One step of the pending warmup reservation calculation. */
export interface PendingWarmupReservationFactor {
  describe(): string;
  adjust(item: PendingWarmupReservation, value: number): number;
}

export class CountryPendingWarmupReservationAdjuster implements PendingWarmupReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PendingWarmupReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingWarmupReservationAdjuster implements PendingWarmupReservationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingWarmupReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingWarmupReservationAdjuster implements PendingWarmupReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingWarmupReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingWarmupReservationAdjuster implements PendingWarmupReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingWarmupReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending warmup reservation steps in order and keeps a trace of each. */
export class PendingWarmupReservationEngine {
  steps: PendingWarmupReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingWarmupReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingWarmupReservation): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PendingWarmupReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingWarmupReservationEngine(): PendingWarmupReservationEngine {
  return new PendingWarmupReservationEngine(
    [
      new CountryPendingWarmupReservationAdjuster(
        new Map<string, number>([["north", 0.71], ["west", 1.19], ["south", 1.34]]),
      ),
      new PercentPendingWarmupReservationAdjuster(0.8),
      new TieredPendingWarmupReservationAdjuster([5068, 5345, 5590, 6665], [0.88, 0.9, 1.19, 1.05]),
      new CapPendingWarmupReservationAdjuster(14924),
    ],
    [],
    2.1,
    28673.6,
  );
}
