import * as numbers from "../../../../kit/numbers.js";
import { CreditReservation } from "./credit-reservation.js";

/** One step of the credit reservation calculation. */
export interface CreditReservationStep {
  describe(): string;
  adjust(item: CreditReservation, value: number): number;
}

export class UtmSourceCreditReservationAdjuster implements CreditReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: CreditReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCreditReservationAdjuster implements CreditReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCreditReservationAdjuster implements CreditReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCreditReservationAdjuster implements CreditReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the credit reservation steps in order and keeps a trace of each. */
export class CreditReservationEngine {
  steps: CreditReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreditReservation): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CreditReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreditReservationEngine(): CreditReservationEngine {
  return new CreditReservationEngine(
    [
      new UtmSourceCreditReservationAdjuster(
        new Map<string, number>([["south", 1.23], ["retail", 1.38], ["east", 1.01]]),
      ),
      new CapCreditReservationAdjuster(1125),
      new RoundingCreditReservationAdjuster(0.05),
      new TieredCreditReservationAdjuster([3373, 5686, 7865, 8131], [1.17, 0.91, 0.83, 0.92]),
    ],
    [],
    4.6,
    91527.6,
  );
}
