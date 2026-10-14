import * as numbers from "../../../../kit/numbers.js";
import { LegacyBidRuleReview } from "./legacy-bid-rule-review.js";

/** One step of the legacy bid rule review calculation. */
export interface LegacyBidRuleReviewStep {
  describe(): string;
  adjust(item: LegacyBidRuleReview, value: number): number;
}

export class MinimumLegacyBidRuleReviewAdjuster implements LegacyBidRuleReviewStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyBidRuleReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyBidRuleReviewAdjuster implements LegacyBidRuleReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyBidRuleReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLegacyBidRuleReviewAdjuster implements LegacyBidRuleReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyBidRuleReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyBidRuleReviewCeilingOffsetAdjuster implements LegacyBidRuleReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: LegacyBidRuleReview, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class TieredLegacyBidRuleReviewAdjuster implements LegacyBidRuleReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyBidRuleReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy bid rule review steps in order and keeps a trace of each. */
export class LegacyBidRuleReviewEngine {
  steps: LegacyBidRuleReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyBidRuleReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyBidRuleReview): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LegacyBidRuleReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyBidRuleReviewEngine(): LegacyBidRuleReviewEngine {
  return new LegacyBidRuleReviewEngine(
    [
      new MinimumLegacyBidRuleReviewAdjuster(47.8),
      new RoundingLegacyBidRuleReviewAdjuster(0.1),
      new PercentLegacyBidRuleReviewAdjuster(-7.5),
      new LegacyBidRuleReviewCeilingOffsetAdjuster(1.43),
      new TieredLegacyBidRuleReviewAdjuster([1185, 2129, 7591], [1.12, 1.14, 0.81]),
    ],
    [],
    2.3,
    81015.6,
  );
}
