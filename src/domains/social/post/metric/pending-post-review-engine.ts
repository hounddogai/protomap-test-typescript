import { PendingPostReview } from "./pending-post-review.js";

/** One step of the pending post review calculation. */
export interface PendingPostReviewModifier {
  describe(): string;
  adjust(item: PendingPostReview, value: number): number;
}

export class CapPendingPostReviewAdjuster implements PendingPostReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPostReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryPendingPostReviewAdjuster implements PendingPostReviewModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PendingPostReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingPostReviewCeilingOffsetAdjuster implements PendingPostReviewModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PendingPostReview, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

/** Runs the pending post review steps in order and keeps a trace of each. */
export class PendingPostReviewEngine {
  steps: PendingPostReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPostReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingPostReview): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PendingPostReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingPostReviewEngine(): PendingPostReviewEngine {
  return new PendingPostReviewEngine(
    [
      new CapPendingPostReviewAdjuster(44994),
      new CategoryPendingPostReviewAdjuster(new Map<string, number>([["south", 0.82]])),
      new PendingPostReviewCeilingOffsetAdjuster(1.44),
    ],
    [],
    2.4,
    34745.6,
  );
}
