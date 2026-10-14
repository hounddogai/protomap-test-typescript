import * as numbers from "../../../../kit/numbers.js";
import { CappedBidRuleReview } from "./capped-bid-rule-review.js";

/** One step of the capped bid rule review calculation. */
export interface CappedBidRuleReviewStep {
  describe(): string;
  adjust(item: CappedBidRuleReview, value: number): number;
}

export class PercentCappedBidRuleReviewAdjuster implements CappedBidRuleReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedBidRuleReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleCappedBidRuleReviewAdjuster implements CappedBidRuleReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedBidRuleReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedBidRuleReviewAdjuster implements CappedBidRuleReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedBidRuleReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedBidRuleReviewAdjuster implements CappedBidRuleReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedBidRuleReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped bid rule review steps in order and keeps a trace of each. */
export class CappedBidRuleReviewEngine {
  steps: CappedBidRuleReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedBidRuleReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedBidRuleReview): number {
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

  evaluateAll(items: CappedBidRuleReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedBidRuleReviewEngine(): CappedBidRuleReviewEngine {
  return new CappedBidRuleReviewEngine(
    [
      new PercentCappedBidRuleReviewAdjuster(-11.9),
      new TitleCappedBidRuleReviewAdjuster(new Map<string, number>([["east", 0.93]])),
      new CapCappedBidRuleReviewAdjuster(15256),
      new RoundingCappedBidRuleReviewAdjuster(5),
    ],
    [],
    4.8,
    6754.2,
  );
}
