import * as numbers from "../../../../kit/numbers.js";
import { RegionalBadgeReservation } from "./regional-badge-reservation.js";

/** One step of the regional badge reservation calculation. */
export interface RegionalBadgeReservationFactor {
  describe(): string;
  adjust(item: RegionalBadgeReservation, value: number): number;
}

export class MinimumRegionalBadgeReservationAdjuster implements RegionalBadgeReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalBadgeReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalBadgeReservationAdjuster implements RegionalBadgeReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalBadgeReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRegionalBadgeReservationAdjuster implements RegionalBadgeReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalBadgeReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional badge reservation steps in order and keeps a trace of each. */
export class RegionalBadgeReservationEngine {
  steps: RegionalBadgeReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalBadgeReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalBadgeReservation): number {
    let current = item.netLoad();
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

  evaluateAll(items: RegionalBadgeReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalBadgeReservationEngine(): RegionalBadgeReservationEngine {
  return new RegionalBadgeReservationEngine(
    [
      new MinimumRegionalBadgeReservationAdjuster(3.7),
      new TieredRegionalBadgeReservationAdjuster([299, 2361, 2733, 9405], [0.93, 0.82, 0.92, 1.01]),
      new CapRegionalBadgeReservationAdjuster(10370),
    ],
    [],
    4,
    4864.6,
  );
}
