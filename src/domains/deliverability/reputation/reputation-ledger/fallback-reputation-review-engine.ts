import { FallbackReputationReview } from "./fallback-reputation-review.js";

/** One step of the fallback reputation review calculation. */
export interface FallbackReputationReviewStep {
  describe(): string;
  adjust(item: FallbackReputationReview, value: number): number;
}

export class CapFallbackReputationReviewAdjuster implements FallbackReputationReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackReputationReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackReputationReviewAdjuster implements FallbackReputationReviewStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackReputationReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameFallbackReputationReviewAdjuster implements FallbackReputationReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackReputationReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback reputation review steps in order and keeps a trace of each. */
export class FallbackReputationReviewEngine {
  steps: FallbackReputationReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackReputationReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackReputationReview): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackReputationReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackReputationReviewEngine(): FallbackReputationReviewEngine {
  return new FallbackReputationReviewEngine(
    [
      new CapFallbackReputationReviewAdjuster(25433),
      new PercentFallbackReputationReviewAdjuster(-24.3),
      new NameFallbackReputationReviewAdjuster(new Map<string, number>([["retail", 1.17], ["online", 1.08]])),
    ],
    [],
    1.7,
    33217,
  );
}
