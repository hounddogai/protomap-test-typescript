import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledMentionReview } from "./scheduled-mention-review.js";

/** One step of the scheduled mention review calculation. */
export interface ScheduledMentionReviewFactor {
  describe(): string;
  adjust(item: ScheduledMentionReview, value: number): number;
}

export class FlaggedScheduledMentionReviewAdjuster implements ScheduledMentionReviewFactor {
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

  adjust(item: ScheduledMentionReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingScheduledMentionReviewAdjuster implements ScheduledMentionReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledMentionReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleScheduledMentionReviewAdjuster implements ScheduledMentionReviewFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ScheduledMentionReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ScheduledMentionReviewRevisionOffsetAdjuster implements ScheduledMentionReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ScheduledMentionReview, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class MinimumScheduledMentionReviewAdjuster implements ScheduledMentionReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledMentionReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledMentionReviewAdjuster implements ScheduledMentionReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledMentionReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled mention review steps in order and keeps a trace of each. */
export class ScheduledMentionReviewEngine {
  steps: ScheduledMentionReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledMentionReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledMentionReview): number {
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

  evaluateAll(items: ScheduledMentionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledMentionReviewEngine(flagsValue: flags.Registry): ScheduledMentionReviewEngine {
  return new ScheduledMentionReviewEngine(
    [
      new FlaggedScheduledMentionReviewAdjuster(flagsValue, "scheduled-mention-review-default", -2.6),
      new RoundingScheduledMentionReviewAdjuster(1),
      new TitleScheduledMentionReviewAdjuster(new Map<string, number>([["east", 0.76]])),
      new ScheduledMentionReviewRevisionOffsetAdjuster(1.11),
      new MinimumScheduledMentionReviewAdjuster(7.4),
      new CapScheduledMentionReviewAdjuster(25875),
    ],
    [],
    5,
    83872.1,
  );
}
