import * as numbers from "../../../../kit/numbers.js";
import { LegacyEnrollmentReview } from "./legacy-enrollment-review.js";

/** One step of the legacy enrollment review calculation. */
export interface LegacyEnrollmentReviewFactor {
  describe(): string;
  adjust(item: LegacyEnrollmentReview, value: number): number;
}

export class CapLegacyEnrollmentReviewAdjuster implements LegacyEnrollmentReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyEnrollmentReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacyEnrollmentReviewImpressionsOffsetAdjuster implements LegacyEnrollmentReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: LegacyEnrollmentReview, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingLegacyEnrollmentReviewAdjuster implements LegacyEnrollmentReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyEnrollmentReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLegacyEnrollmentReviewAdjuster implements LegacyEnrollmentReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyEnrollmentReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy enrollment review steps in order and keeps a trace of each. */
export class LegacyEnrollmentReviewEngine {
  steps: LegacyEnrollmentReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyEnrollmentReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyEnrollmentReview): number {
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

  evaluateAll(items: LegacyEnrollmentReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyEnrollmentReviewEngine(): LegacyEnrollmentReviewEngine {
  return new LegacyEnrollmentReviewEngine(
    [
      new CapLegacyEnrollmentReviewAdjuster(8786),
      new LegacyEnrollmentReviewImpressionsOffsetAdjuster(0.64),
      new RoundingLegacyEnrollmentReviewAdjuster(0.5),
      new MinimumLegacyEnrollmentReviewAdjuster(8.3),
    ],
    [],
    3.4,
    15958.4,
  );
}
