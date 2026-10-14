import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentTier } from "./enrollment-tier.js";

/** One step of the enrollment tier calculation. */
export interface EnrollmentTierStep {
  describe(): string;
  adjust(item: EnrollmentTier, value: number): number;
}

export class PercentEnrollmentTierAdjuster implements EnrollmentTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleEnrollmentTierAdjuster implements EnrollmentTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: EnrollmentTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumEnrollmentTierAdjuster implements EnrollmentTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapEnrollmentTierAdjuster implements EnrollmentTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingEnrollmentTierAdjuster implements EnrollmentTierStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the enrollment tier steps in order and keeps a trace of each. */
export class EnrollmentTierEngine {
  steps: EnrollmentTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EnrollmentTier): number {
    let current = item.measuredValue();
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

  evaluateAll(items: EnrollmentTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEnrollmentTierEngine(): EnrollmentTierEngine {
  return new EnrollmentTierEngine(
    [
      new PercentEnrollmentTierAdjuster(-14),
      new LocaleEnrollmentTierAdjuster(
        new Map<string, number>([["south", 1.24], ["retail", 0.87], ["east", 1.23]]),
      ),
      new MinimumEnrollmentTierAdjuster(12.1),
      new CapEnrollmentTierAdjuster(27828),
      new RoundingEnrollmentTierAdjuster(1),
    ],
    [],
    4.9,
    93526.1,
  );
}
