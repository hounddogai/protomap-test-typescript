import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentDigest } from "./enrollment-digest.js";

/** One step of the enrollment digest calculation. */
export interface EnrollmentDigestStep {
  describe(): string;
  adjust(item: EnrollmentDigest, value: number): number;
}

export class RoundingEnrollmentDigestAdjuster implements EnrollmentDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumEnrollmentDigestAdjuster implements EnrollmentDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredEnrollmentDigestAdjuster implements EnrollmentDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentEnrollmentDigestAdjuster implements EnrollmentDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment digest steps in order and keeps a trace of each. */
export class EnrollmentDigestEngine {
  steps: EnrollmentDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EnrollmentDigest): number {
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

  evaluateAll(items: EnrollmentDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEnrollmentDigestEngine(): EnrollmentDigestEngine {
  return new EnrollmentDigestEngine(
    [
      new RoundingEnrollmentDigestAdjuster(0.5),
      new MinimumEnrollmentDigestAdjuster(49.4),
      new TieredEnrollmentDigestAdjuster([3383, 4510, 7923], [0.95, 0.85, 0.97]),
      new PercentEnrollmentDigestAdjuster(24),
    ],
    [],
    5,
    67444.4,
  );
}
