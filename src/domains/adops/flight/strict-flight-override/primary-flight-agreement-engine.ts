import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFlightAgreement } from "./primary-flight-agreement.js";

/** One step of the primary flight agreement calculation. */
export interface PrimaryFlightAgreementStep {
  describe(): string;
  adjust(item: PrimaryFlightAgreement, value: number): number;
}

export class CapPrimaryFlightAgreementAdjuster implements PrimaryFlightAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryFlightAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPrimaryFlightAgreementAdjuster implements PrimaryFlightAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryFlightAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPrimaryFlightAgreementAdjuster implements PrimaryFlightAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryFlightAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary flight agreement steps in order and keeps a trace of each. */
export class PrimaryFlightAgreementEngine {
  steps: PrimaryFlightAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFlightAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryFlightAgreement): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PrimaryFlightAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryFlightAgreementEngine(): PrimaryFlightAgreementEngine {
  return new PrimaryFlightAgreementEngine(
    [
      new CapPrimaryFlightAgreementAdjuster(28915),
      new TieredPrimaryFlightAgreementAdjuster([2951, 4520], [1.17, 1.15]),
      new RoundingPrimaryFlightAgreementAdjuster(0.25),
    ],
    [],
    2.7,
    59762.3,
  );
}
