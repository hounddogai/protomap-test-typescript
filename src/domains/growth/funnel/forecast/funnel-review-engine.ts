import * as flags from "../../../../kit/flags.js";
import { FunnelReview } from "./funnel-review.js";

/** One step of the funnel review calculation. */
export interface FunnelReviewFactor {
  describe(): string;
  adjust(item: FunnelReview, value: number): number;
}

export class CapFunnelReviewAdjuster implements FunnelReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFunnelReviewAdjuster implements FunnelReviewFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFunnelReviewAdjuster implements FunnelReviewFactor {
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

  adjust(item: FunnelReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel review steps in order and keeps a trace of each. */
export class FunnelReviewEngine {
  steps: FunnelReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelReview): number {
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

  evaluateAll(items: FunnelReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelReviewEngine(flagsValue: flags.Registry): FunnelReviewEngine {
  return new FunnelReviewEngine(
    [
      new CapFunnelReviewAdjuster(7837),
      new PercentFunnelReviewAdjuster(-3.1),
      new FlaggedFunnelReviewAdjuster(flagsValue, "funnel-review-seasonal", -1),
    ],
    [],
    0.7,
    38626.4,
  );
}
