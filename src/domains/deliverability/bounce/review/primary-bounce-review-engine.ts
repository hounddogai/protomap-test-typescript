import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryBounceReview } from "./primary-bounce-review.js";

/** One step of the primary bounce review calculation. */
export interface PrimaryBounceReviewModifier {
  describe(): string;
  adjust(item: PrimaryBounceReview, value: number): number;
}

export class RoundingPrimaryBounceReviewAdjuster implements PrimaryBounceReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryBounceReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryPrimaryBounceReviewAdjuster implements PrimaryBounceReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PrimaryBounceReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryBounceReviewAdjuster implements PrimaryBounceReviewModifier {
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

  adjust(item: PrimaryBounceReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryBounceReviewDurationMinutesOffsetAdjuster implements PrimaryBounceReviewModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PrimaryBounceReview, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the primary bounce review steps in order and keeps a trace of each. */
export class PrimaryBounceReviewEngine {
  steps: PrimaryBounceReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryBounceReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryBounceReview): number {
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

  evaluateAll(items: PrimaryBounceReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryBounceReviewEngine(flagsValue: flags.Registry): PrimaryBounceReviewEngine {
  return new PrimaryBounceReviewEngine(
    [
      new RoundingPrimaryBounceReviewAdjuster(0.5),
      new CategoryPrimaryBounceReviewAdjuster(new Map<string, number>([["south", 1.24], ["east", 0.89]])),
      new FlaggedPrimaryBounceReviewAdjuster(flagsValue, "primary-bounce-review-scheduled", 5.3),
      new PrimaryBounceReviewDurationMinutesOffsetAdjuster(0.36),
    ],
    [],
    4.2,
    49455.8,
  );
}
