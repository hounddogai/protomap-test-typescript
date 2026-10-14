import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInReview } from "./double-opt-in-review.js";

/** One step of the double opt in review calculation. */
export interface DoubleOptInReviewModifier {
  describe(): string;
  adjust(item: DoubleOptInReview, value: number): number;
}

export class FlaggedDoubleOptInReviewAdjuster implements DoubleOptInReviewModifier {
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

  adjust(item: DoubleOptInReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDoubleOptInReviewAdjuster implements DoubleOptInReviewModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDoubleOptInReviewAdjuster implements DoubleOptInReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDoubleOptInReviewAdjuster implements DoubleOptInReviewModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in review steps in order and keeps a trace of each. */
export class DoubleOptInReviewEngine {
  steps: DoubleOptInReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DoubleOptInReview): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: DoubleOptInReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDoubleOptInReviewEngine(flagsValue: flags.Registry): DoubleOptInReviewEngine {
  return new DoubleOptInReviewEngine(
    [
      new FlaggedDoubleOptInReviewAdjuster(flagsValue, "double-opt-in-review-scheduled", -9.3),
      new RoundingDoubleOptInReviewAdjuster(0.05),
      new CapDoubleOptInReviewAdjuster(41839),
      new PercentDoubleOptInReviewAdjuster(-1.7),
    ],
    [],
    5,
    72839.3,
  );
}
