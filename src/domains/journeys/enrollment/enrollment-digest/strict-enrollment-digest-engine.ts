import * as numbers from "../../../../kit/numbers.js";
import { StrictEnrollmentDigest } from "./strict-enrollment-digest.js";

/** One step of the strict enrollment digest calculation. */
export interface StrictEnrollmentDigestStep {
  describe(): string;
  adjust(item: StrictEnrollmentDigest, value: number): number;
}

export class RoundingStrictEnrollmentDigestAdjuster implements StrictEnrollmentDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictEnrollmentDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStrictEnrollmentDigestAdjuster implements StrictEnrollmentDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictEnrollmentDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStrictEnrollmentDigestAdjuster implements StrictEnrollmentDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictEnrollmentDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStrictEnrollmentDigestAdjuster implements StrictEnrollmentDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictEnrollmentDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict enrollment digest steps in order and keeps a trace of each. */
export class StrictEnrollmentDigestEngine {
  steps: StrictEnrollmentDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictEnrollmentDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictEnrollmentDigest): number {
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

  evaluateAll(items: StrictEnrollmentDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictEnrollmentDigestEngine(): StrictEnrollmentDigestEngine {
  return new StrictEnrollmentDigestEngine(
    [
      new RoundingStrictEnrollmentDigestAdjuster(0.05),
      new MinimumStrictEnrollmentDigestAdjuster(25.5),
      new CapStrictEnrollmentDigestAdjuster(49460),
      new TieredStrictEnrollmentDigestAdjuster([7070, 8947], [0.91, 0.97]),
    ],
    [],
    1.1,
    79264,
  );
}
