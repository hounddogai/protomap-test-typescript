import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPacingReview } from "./primary-pacing-review.js";

/** One step of the primary pacing review calculation. */
export interface PrimaryPacingReviewAdjuster {
  describe(): string;
  adjust(item: PrimaryPacingReview, value: number): number;
}

export class RoundingPrimaryPacingReviewAdjuster implements PrimaryPacingReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryPacingReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPrimaryPacingReviewAdjuster implements PrimaryPacingReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPacingReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryPacingReviewAdjuster implements PrimaryPacingReviewAdjuster {
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

  adjust(item: PrimaryPacingReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary pacing review steps in order and keeps a trace of each. */
export class PrimaryPacingReviewEngine {
  steps: PrimaryPacingReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPacingReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPacingReview): number {
    let current = item.netValue();
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

  evaluateAll(items: PrimaryPacingReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPacingReviewEngine(flagsValue: flags.Registry): PrimaryPacingReviewEngine {
  return new PrimaryPacingReviewEngine(
    [
      new RoundingPrimaryPacingReviewAdjuster(5),
      new PercentPrimaryPacingReviewAdjuster(-23.3),
      new FlaggedPrimaryPacingReviewAdjuster(flagsValue, "primary-pacing-review-manual", 8.6),
    ],
    [],
    4,
    94920.4,
  );
}
