import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualMentionReview } from "./manual-mention-review.js";

/** One step of the manual mention review calculation. */
export interface ManualMentionReviewAdjuster {
  describe(): string;
  adjust(item: ManualMentionReview, value: number): number;
}

export class FlaggedManualMentionReviewAdjuster implements ManualMentionReviewAdjuster {
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

  adjust(item: ManualMentionReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualMentionReviewAdjuster implements ManualMentionReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualMentionReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualMentionReviewAdjuster implements ManualMentionReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualMentionReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelManualMentionReviewAdjuster implements ManualMentionReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ManualMentionReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual mention review steps in order and keeps a trace of each. */
export class ManualMentionReviewEngine {
  steps: ManualMentionReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualMentionReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualMentionReview): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ManualMentionReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualMentionReviewEngine(flagsValue: flags.Registry): ManualMentionReviewEngine {
  return new ManualMentionReviewEngine(
    [
      new FlaggedManualMentionReviewAdjuster(flagsValue, "manual-mention-review-tiered", -6.9),
      new CapManualMentionReviewAdjuster(23090),
      new PercentManualMentionReviewAdjuster(7.8),
      new LabelManualMentionReviewAdjuster(new Map<string, number>([["retail", 1.29]])),
    ],
    [],
    1.5,
    55795.8,
  );
}
