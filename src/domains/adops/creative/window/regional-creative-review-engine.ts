import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalCreativeReview } from "./regional-creative-review.js";

/** One step of the regional creative review calculation. */
export interface RegionalCreativeReviewFactor {
  describe(): string;
  adjust(item: RegionalCreativeReview, value: number): number;
}

export class FlaggedRegionalCreativeReviewAdjuster implements RegionalCreativeReviewFactor {
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

  adjust(item: RegionalCreativeReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalCreativeReviewAdjuster implements RegionalCreativeReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalCreativeReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalCreativeReviewAdjuster implements RegionalCreativeReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalCreativeReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRegionalCreativeReviewAdjuster implements RegionalCreativeReviewFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalCreativeReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalCreativeReviewAdjuster implements RegionalCreativeReviewFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalCreativeReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionalCreativeReviewRetriesOffsetAdjuster implements RegionalCreativeReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: RegionalCreativeReview, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the regional creative review steps in order and keeps a trace of each. */
export class RegionalCreativeReviewEngine {
  steps: RegionalCreativeReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCreativeReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalCreativeReview): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RegionalCreativeReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalCreativeReviewEngine(flagsValue: flags.Registry): RegionalCreativeReviewEngine {
  return new RegionalCreativeReviewEngine(
    [
      new FlaggedRegionalCreativeReviewAdjuster(flagsValue, "regional-creative-review-legacy", -9.2),
      new MinimumRegionalCreativeReviewAdjuster(5.1),
      new CapRegionalCreativeReviewAdjuster(16358),
      new PercentRegionalCreativeReviewAdjuster(-4),
      new RoundingRegionalCreativeReviewAdjuster(5),
      new RegionalCreativeReviewRetriesOffsetAdjuster(0.96),
    ],
    [],
    3.4,
    86208.9,
  );
}
