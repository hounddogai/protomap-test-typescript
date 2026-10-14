import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictSubscriptionReview } from "./strict-subscription-review.js";

/** One step of the strict subscription review calculation. */
export interface StrictSubscriptionReviewAdjuster {
  describe(): string;
  adjust(item: StrictSubscriptionReview, value: number): number;
}

export class FlaggedStrictSubscriptionReviewAdjuster implements StrictSubscriptionReviewAdjuster {
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

  adjust(item: StrictSubscriptionReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictSubscriptionReviewAdjuster implements StrictSubscriptionReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictSubscriptionReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictSubscriptionReviewAdjuster implements StrictSubscriptionReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictSubscriptionReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class StrictSubscriptionReviewCeilingOffsetAdjuster implements StrictSubscriptionReviewAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: StrictSubscriptionReview, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingStrictSubscriptionReviewAdjuster implements StrictSubscriptionReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictSubscriptionReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the strict subscription review steps in order and keeps a trace of each. */
export class StrictSubscriptionReviewEngine {
  steps: StrictSubscriptionReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictSubscriptionReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictSubscriptionReview): number {
    let current = item.netTotal();
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

  evaluateAll(items: StrictSubscriptionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictSubscriptionReviewEngine(flagsValue: flags.Registry): StrictSubscriptionReviewEngine {
  return new StrictSubscriptionReviewEngine(
    [
      new FlaggedStrictSubscriptionReviewAdjuster(flagsValue, "strict-subscription-review-manual", 6.3),
      new CapStrictSubscriptionReviewAdjuster(13853),
      new PercentStrictSubscriptionReviewAdjuster(-18.4),
      new StrictSubscriptionReviewCeilingOffsetAdjuster(1.04),
      new RoundingStrictSubscriptionReviewAdjuster(1),
    ],
    [],
    0.8,
    85484.7,
  );
}
