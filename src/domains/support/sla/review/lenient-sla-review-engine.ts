import * as numbers from "../../../../kit/numbers.js";
import { LenientSlaReview } from "./lenient-sla-review.js";

/** One step of the lenient sla review calculation. */
export interface LenientSlaReviewStep {
  describe(): string;
  adjust(item: LenientSlaReview, value: number): number;
}

export class LenientSlaReviewBudgetOffsetAdjuster implements LenientSlaReviewStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: LenientSlaReview, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapLenientSlaReviewAdjuster implements LenientSlaReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientSlaReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SourceLenientSlaReviewAdjuster implements LenientSlaReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: LenientSlaReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient sla review steps in order and keeps a trace of each. */
export class LenientSlaReviewEngine {
  steps: LenientSlaReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSlaReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientSlaReview): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: LenientSlaReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientSlaReviewEngine(): LenientSlaReviewEngine {
  return new LenientSlaReviewEngine(
    [
      new LenientSlaReviewBudgetOffsetAdjuster(0.98),
      new CapLenientSlaReviewAdjuster(26776),
      new SourceLenientSlaReviewAdjuster(new Map<string, number>([["central", 0.88], ["west", 1.11]])),
    ],
    [],
    2.2,
    42806.6,
  );
}
