import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentReservation } from "./enrollment-reservation.js";

/** One step of the enrollment reservation calculation. */
export interface EnrollmentReservationAdjuster {
  describe(): string;
  adjust(item: EnrollmentReservation, value: number): number;
}

export class PercentEnrollmentReservationAdjuster implements EnrollmentReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredEnrollmentReservationAdjuster implements EnrollmentReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumEnrollmentReservationAdjuster implements EnrollmentReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleEnrollmentReservationAdjuster implements EnrollmentReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: EnrollmentReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class EnrollmentReservationBudgetOffsetAdjuster implements EnrollmentReservationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: EnrollmentReservation, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the enrollment reservation steps in order and keeps a trace of each. */
export class EnrollmentReservationEngine {
  steps: EnrollmentReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EnrollmentReservation): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: EnrollmentReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEnrollmentReservationEngine(): EnrollmentReservationEngine {
  return new EnrollmentReservationEngine(
    [
      new PercentEnrollmentReservationAdjuster(-13.4),
      new TieredEnrollmentReservationAdjuster([78, 393, 8767], [0.82, 1.03, 0.8]),
      new MinimumEnrollmentReservationAdjuster(49.3),
      new TitleEnrollmentReservationAdjuster(
        new Map<string, number>([["north", 0.86], ["east", 1.28], ["central", 0.9]]),
      ),
      new EnrollmentReservationBudgetOffsetAdjuster(0.55),
    ],
    [],
    4.7,
    5233.2,
  );
}
