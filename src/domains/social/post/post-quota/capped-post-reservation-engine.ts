import * as numbers from "../../../../kit/numbers.js";
import { CappedPostReservation } from "./capped-post-reservation.js";

/** One step of the capped post reservation calculation. */
export interface CappedPostReservationModifier {
  describe(): string;
  adjust(item: CappedPostReservation, value: number): number;
}

export class TieredCappedPostReservationAdjuster implements CappedPostReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedPostReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCappedPostReservationAdjuster implements CappedPostReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedPostReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CappedPostReservationCapacityOffsetAdjuster implements CappedPostReservationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: CappedPostReservation, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the capped post reservation steps in order and keeps a trace of each. */
export class CappedPostReservationEngine {
  steps: CappedPostReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPostReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedPostReservation): number {
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

  evaluateAll(items: CappedPostReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedPostReservationEngine(): CappedPostReservationEngine {
  return new CappedPostReservationEngine(
    [
      new TieredCappedPostReservationAdjuster([2541, 2857, 5456, 9750], [1.03, 0.96, 0.85, 0.99]),
      new CapCappedPostReservationAdjuster(38755),
      new CappedPostReservationCapacityOffsetAdjuster(0.8),
    ],
    [],
    3.4,
    93096.8,
  );
}
