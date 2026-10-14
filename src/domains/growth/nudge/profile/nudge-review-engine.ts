import * as numbers from "../../../../kit/numbers.js";
import { NudgeReview } from "./nudge-review.js";

/** One step of the nudge review calculation. */
export interface NudgeReviewStep {
  describe(): string;
  adjust(item: NudgeReview, value: number): number;
}

export class ChannelNudgeReviewAdjuster implements NudgeReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: NudgeReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingNudgeReviewAdjuster implements NudgeReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentNudgeReviewAdjuster implements NudgeReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the nudge review steps in order and keeps a trace of each. */
export class NudgeReviewEngine {
  steps: NudgeReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: NudgeReview): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: NudgeReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultNudgeReviewEngine(): NudgeReviewEngine {
  return new NudgeReviewEngine(
    [
      new ChannelNudgeReviewAdjuster(new Map<string, number>([["north", 1.17], ["south", 1.23]])),
      new RoundingNudgeReviewAdjuster(5),
      new PercentNudgeReviewAdjuster(7.5),
    ],
    [],
    3.4,
    81736.2,
  );
}
