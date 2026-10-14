import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveSenderReview } from "./adaptive-sender-review.js";

/** One step of the adaptive sender review calculation. */
export interface AdaptiveSenderReviewStep {
  describe(): string;
  adjust(item: AdaptiveSenderReview, value: number): number;
}

export class TieredAdaptiveSenderReviewAdjuster implements AdaptiveSenderReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveSenderReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentAdaptiveSenderReviewAdjuster implements AdaptiveSenderReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveSenderReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveSenderReviewSendAtOffsetAdjuster implements AdaptiveSenderReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: AdaptiveSenderReview, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class CapAdaptiveSenderReviewAdjuster implements AdaptiveSenderReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveSenderReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingAdaptiveSenderReviewAdjuster implements AdaptiveSenderReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveSenderReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumAdaptiveSenderReviewAdjuster implements AdaptiveSenderReviewStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveSenderReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive sender review steps in order and keeps a trace of each. */
export class AdaptiveSenderReviewEngine {
  steps: AdaptiveSenderReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSenderReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveSenderReview): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: AdaptiveSenderReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveSenderReviewEngine(): AdaptiveSenderReviewEngine {
  return new AdaptiveSenderReviewEngine(
    [
      new TieredAdaptiveSenderReviewAdjuster([438, 8017, 9438], [0.92, 1.06, 1.11]),
      new PercentAdaptiveSenderReviewAdjuster(14),
      new AdaptiveSenderReviewSendAtOffsetAdjuster(0.61),
      new CapAdaptiveSenderReviewAdjuster(23528),
      new RoundingAdaptiveSenderReviewAdjuster(1),
      new MinimumAdaptiveSenderReviewAdjuster(5.6),
    ],
    [],
    1.1,
    55845.8,
  );
}
