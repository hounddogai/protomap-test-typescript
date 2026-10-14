import * as numbers from "../../../../kit/numbers.js";
import { ReputationReservation } from "./reputation-reservation.js";

/** One step of the reputation reservation calculation. */
export interface ReputationReservationAdjuster {
  describe(): string;
  adjust(item: ReputationReservation, value: number): number;
}

export class CapReputationReservationAdjuster implements ReputationReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumReputationReservationAdjuster implements ReputationReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredReputationReservationAdjuster implements ReputationReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reputation reservation steps in order and keeps a trace of each. */
export class ReputationReservationEngine {
  steps: ReputationReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationReservation): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ReputationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationReservationEngine(): ReputationReservationEngine {
  return new ReputationReservationEngine(
    [
      new CapReputationReservationAdjuster(10177),
      new MinimumReputationReservationAdjuster(9.7),
      new TieredReputationReservationAdjuster([3031, 3613, 8519, 9829], [1.02, 0.94, 0.97, 1.06]),
    ],
    [],
    4.8,
    56290.7,
  );
}
