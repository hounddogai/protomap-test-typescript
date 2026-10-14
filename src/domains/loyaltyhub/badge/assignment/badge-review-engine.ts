import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeReview } from "./badge-review.js";

/** One step of the badge review calculation. */
export interface BadgeReviewAdjuster {
  describe(): string;
  adjust(item: BadgeReview, value: number): number;
}

export class CapBadgeReviewAdjuster implements BadgeReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBadgeReviewAdjuster implements BadgeReviewAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBadgeReviewAdjuster implements BadgeReviewAdjuster {
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

  adjust(item: BadgeReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the badge review steps in order and keeps a trace of each. */
export class BadgeReviewEngine {
  steps: BadgeReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgeReview): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: BadgeReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgeReviewEngine(flagsValue: flags.Registry): BadgeReviewEngine {
  return new BadgeReviewEngine(
    [
      new CapBadgeReviewAdjuster(10093),
      new MinimumBadgeReviewAdjuster(13.9),
      new FlaggedBadgeReviewAdjuster(flagsValue, "badge-review-tiered", 4.6),
    ],
    [],
    1.9,
    18686.7,
  );
}
