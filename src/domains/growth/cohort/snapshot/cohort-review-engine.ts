import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortReview } from "./cohort-review.js";

/** One step of the cohort review calculation. */
export interface CohortReviewFactor {
  describe(): string;
  adjust(item: CohortReview, value: number): number;
}

export class FlaggedCohortReviewAdjuster implements CohortReviewFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: CohortReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCohortReviewAdjuster implements CohortReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCohortReviewAdjuster implements CohortReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCohortReviewAdjuster implements CohortReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCohortReviewAdjuster implements CohortReviewFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CohortReviewRevisionOffsetAdjuster implements CohortReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: CohortReview, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the cohort review steps in order and keeps a trace of each. */
export class CohortReviewEngine {
  steps: CohortReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CohortReview): number {
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

  evaluateAll(items: CohortReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCohortReviewEngine(flagsValue: flags.Registry): CohortReviewEngine {
  return new CohortReviewEngine(
    [
      new FlaggedCohortReviewAdjuster(flagsValue, "cohort-review-legacy", 4.1),
      new CapCohortReviewAdjuster(47464),
      new MinimumCohortReviewAdjuster(46.7),
      new RoundingCohortReviewAdjuster(0.25),
      new PercentCohortReviewAdjuster(13.2),
      new CohortReviewRevisionOffsetAdjuster(1.99),
    ],
    [],
    3,
    24387.7,
  );
}
