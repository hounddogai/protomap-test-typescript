import * as numbers from "../../../../kit/numbers.js";
import { RetentionReservation } from "./retention-reservation.js";

/** One step of the retention reservation calculation. */
export interface RetentionReservationModifier {
  describe(): string;
  adjust(item: RetentionReservation, value: number): number;
}

export class TieredRetentionReservationAdjuster implements RetentionReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRetentionReservationAdjuster implements RetentionReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameRetentionReservationAdjuster implements RetentionReservationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RetentionReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the retention reservation steps in order and keeps a trace of each. */
export class RetentionReservationEngine {
  steps: RetentionReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionReservation): number {
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

  evaluateAll(items: RetentionReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionReservationEngine(): RetentionReservationEngine {
  return new RetentionReservationEngine(
    [
      new TieredRetentionReservationAdjuster([306, 2232, 3129, 9258], [0.97, 0.85, 0.82, 0.9]),
      new CapRetentionReservationAdjuster(28610),
      new NameRetentionReservationAdjuster(
        new Map<string, number>([["north", 1.12], ["retail", 1.16], ["online", 0.98]]),
      ),
    ],
    [],
    1.6,
    61118.8,
  );
}
