import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentReview } from "./enrollment-review.js";

/** One step of the enrollment review calculation. */
export interface EnrollmentReviewFactor {
  describe(): string;
  adjust(item: EnrollmentReview, value: number): number;
}

export class TieredEnrollmentReviewAdjuster implements EnrollmentReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class EnrollmentReviewAmountOffsetAdjuster implements EnrollmentReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: EnrollmentReview, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class LocaleEnrollmentReviewAdjuster implements EnrollmentReviewFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: EnrollmentReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumEnrollmentReviewAdjuster implements EnrollmentReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingEnrollmentReviewAdjuster implements EnrollmentReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapEnrollmentReviewAdjuster implements EnrollmentReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the enrollment review steps in order and keeps a trace of each. */
export class EnrollmentReviewEngine {
  steps: EnrollmentReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EnrollmentReview): number {
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

  evaluateAll(items: EnrollmentReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEnrollmentReviewEngine(): EnrollmentReviewEngine {
  return new EnrollmentReviewEngine(
    [
      new TieredEnrollmentReviewAdjuster([205, 6544, 6824, 8211], [0.86, 0.8, 1.01, 1.08]),
      new EnrollmentReviewAmountOffsetAdjuster(1.24),
      new LocaleEnrollmentReviewAdjuster(
        new Map<string, number>([["west", 0.79], ["east", 1], ["south", 0.96]]),
      ),
      new MinimumEnrollmentReviewAdjuster(22.4),
      new RoundingEnrollmentReviewAdjuster(5),
      new CapEnrollmentReviewAdjuster(12926),
    ],
    [],
    3.5,
    27347.2,
  );
}
