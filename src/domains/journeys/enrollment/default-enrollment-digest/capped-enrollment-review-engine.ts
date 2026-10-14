import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedEnrollmentReview } from "./capped-enrollment-review.js";

/** One step of the capped enrollment review calculation. */
export interface CappedEnrollmentReviewAdjuster {
  describe(): string;
  adjust(item: CappedEnrollmentReview, value: number): number;
}

export class PercentCappedEnrollmentReviewAdjuster implements CappedEnrollmentReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedEnrollmentReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleCappedEnrollmentReviewAdjuster implements CappedEnrollmentReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedEnrollmentReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CappedEnrollmentReviewUpdatedAtOffsetAdjuster implements CappedEnrollmentReviewAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: CappedEnrollmentReview, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class FlaggedCappedEnrollmentReviewAdjuster implements CappedEnrollmentReviewAdjuster {
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

  adjust(item: CappedEnrollmentReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped enrollment review steps in order and keeps a trace of each. */
export class CappedEnrollmentReviewEngine {
  steps: CappedEnrollmentReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedEnrollmentReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedEnrollmentReview): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: CappedEnrollmentReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedEnrollmentReviewEngine(flagsValue: flags.Registry): CappedEnrollmentReviewEngine {
  return new CappedEnrollmentReviewEngine(
    [
      new PercentCappedEnrollmentReviewAdjuster(-10),
      new TitleCappedEnrollmentReviewAdjuster(new Map<string, number>([["online", 0.75]])),
      new CappedEnrollmentReviewUpdatedAtOffsetAdjuster(0.7),
      new FlaggedCappedEnrollmentReviewAdjuster(flagsValue, "capped-enrollment-review-pending", 5.6),
    ],
    [],
    1.9,
    85188.6,
  );
}
