import * as numbers from "../../../../kit/numbers.js";
import { StreakReservation } from "./streak-reservation.js";

/** One step of the streak reservation calculation. */
export interface StreakReservationAdjuster {
  describe(): string;
  adjust(item: StreakReservation, value: number): number;
}

export class CapStreakReservationAdjuster implements StreakReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StreakReservationQuantityOffsetAdjuster implements StreakReservationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: StreakReservation, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumStreakReservationAdjuster implements StreakReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredStreakReservationAdjuster implements StreakReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentStreakReservationAdjuster implements StreakReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelStreakReservationAdjuster implements StreakReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StreakReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak reservation steps in order and keeps a trace of each. */
export class StreakReservationEngine {
  steps: StreakReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StreakReservation): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: StreakReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStreakReservationEngine(): StreakReservationEngine {
  return new StreakReservationEngine(
    [
      new CapStreakReservationAdjuster(9031),
      new StreakReservationQuantityOffsetAdjuster(0.22),
      new MinimumStreakReservationAdjuster(24.1),
      new TieredStreakReservationAdjuster([2393, 2418], [1.18, 1.02]),
      new PercentStreakReservationAdjuster(-5.7),
      new LabelStreakReservationAdjuster(new Map<string, number>([["south", 1.16]])),
    ],
    [],
    3.4,
    84355.7,
  );
}
