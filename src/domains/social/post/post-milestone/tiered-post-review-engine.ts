import * as numbers from "../../../../kit/numbers.js";
import { TieredPostReview } from "./tiered-post-review.js";

/** One step of the tiered post review calculation. */
export interface TieredPostReviewAdjuster {
  describe(): string;
  adjust(item: TieredPostReview, value: number): number;
}

export class CapTieredPostReviewAdjuster implements TieredPostReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPostReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredPostReviewAdjuster implements TieredPostReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredPostReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTieredPostReviewAdjuster implements TieredPostReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredPostReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleTieredPostReviewAdjuster implements TieredPostReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TieredPostReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered post review steps in order and keeps a trace of each. */
export class TieredPostReviewEngine {
  steps: TieredPostReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPostReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredPostReview): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: TieredPostReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredPostReviewEngine(): TieredPostReviewEngine {
  return new TieredPostReviewEngine(
    [
      new CapTieredPostReviewAdjuster(38988),
      new RoundingTieredPostReviewAdjuster(0.1),
      new PercentTieredPostReviewAdjuster(24.2),
      new LocaleTieredPostReviewAdjuster(new Map<string, number>([["north", 0.95], ["west", 0.98]])),
    ],
    [],
    2.2,
    93299.2,
  );
}
