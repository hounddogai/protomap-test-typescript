import { RollingNudgeReview } from "./rolling-nudge-review.js";

/** One step of the rolling nudge review calculation. */
export interface RollingNudgeReviewStep {
  describe(): string;
  adjust(item: RollingNudgeReview, value: number): number;
}

export class RegionRollingNudgeReviewAdjuster implements RollingNudgeReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RollingNudgeReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRollingNudgeReviewAdjuster implements RollingNudgeReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingNudgeReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRollingNudgeReviewAdjuster implements RollingNudgeReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingNudgeReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling nudge review steps in order and keeps a trace of each. */
export class RollingNudgeReviewEngine {
  steps: RollingNudgeReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingNudgeReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingNudgeReview): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingNudgeReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingNudgeReviewEngine(): RollingNudgeReviewEngine {
  return new RollingNudgeReviewEngine(
    [
      new RegionRollingNudgeReviewAdjuster(
        new Map<string, number>([["south", 0.82], ["north", 0.83], ["retail", 1.33]]),
      ),
      new CapRollingNudgeReviewAdjuster(35920),
      new TieredRollingNudgeReviewAdjuster([2738, 4324, 8661], [1.08, 1.01, 1.17]),
    ],
    [],
    2.7,
    71096.1,
  );
}
