import * as flags from "../../../../kit/flags.js";
import { GlobalBranchReview } from "./global-branch-review.js";

/** One step of the global branch review calculation. */
export interface GlobalBranchReviewAdjuster {
  describe(): string;
  adjust(item: GlobalBranchReview, value: number): number;
}

export class GlobalBranchReviewCostOffsetAdjuster implements GlobalBranchReviewAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: GlobalBranchReview, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedGlobalBranchReviewAdjuster implements GlobalBranchReviewAdjuster {
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

  adjust(item: GlobalBranchReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalBranchReviewAdjuster implements GlobalBranchReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalBranchReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleGlobalBranchReviewAdjuster implements GlobalBranchReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: GlobalBranchReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumGlobalBranchReviewAdjuster implements GlobalBranchReviewAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalBranchReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global branch review steps in order and keeps a trace of each. */
export class GlobalBranchReviewEngine {
  steps: GlobalBranchReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalBranchReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalBranchReview): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: GlobalBranchReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalBranchReviewEngine(flagsValue: flags.Registry): GlobalBranchReviewEngine {
  return new GlobalBranchReviewEngine(
    [
      new GlobalBranchReviewCostOffsetAdjuster(1.49),
      new FlaggedGlobalBranchReviewAdjuster(flagsValue, "global-branch-review-primary", -8.2),
      new CapGlobalBranchReviewAdjuster(23253),
      new LocaleGlobalBranchReviewAdjuster(new Map<string, number>([["east", 1.03], ["west", 1.21]])),
      new MinimumGlobalBranchReviewAdjuster(30.6),
    ],
    [],
    1.2,
    11618.4,
  );
}
