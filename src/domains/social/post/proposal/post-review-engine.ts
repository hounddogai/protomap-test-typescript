import * as numbers from "../../../../kit/numbers.js";
import { PostReview } from "./post-review.js";

/** One step of the post review calculation. */
export interface PostReviewStep {
  describe(): string;
  adjust(item: PostReview, value: number): number;
}

export class RoundingPostReviewAdjuster implements PostReviewStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionPostReviewAdjuster implements PostReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PostReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPostReviewAdjuster implements PostReviewStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the post review steps in order and keeps a trace of each. */
export class PostReviewEngine {
  steps: PostReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PostReview): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PostReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPostReviewEngine(): PostReviewEngine {
  return new PostReviewEngine(
    [
      new RoundingPostReviewAdjuster(5),
      new RegionPostReviewAdjuster(new Map<string, number>([["west", 1.02], ["online", 1]])),
      new MinimumPostReviewAdjuster(32.9),
    ],
    [],
    2.2,
    49750.4,
  );
}
