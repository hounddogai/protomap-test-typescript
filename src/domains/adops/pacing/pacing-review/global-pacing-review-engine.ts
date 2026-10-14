import * as numbers from "../../../../kit/numbers.js";
import { GlobalPacingReview } from "./global-pacing-review.js";

/** One step of the global pacing review calculation. */
export interface GlobalPacingReviewStep {
  describe(): string;
  adjust(item: GlobalPacingReview, value: number): number;
}

export class TitleGlobalPacingReviewAdjuster implements GlobalPacingReviewStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: GlobalPacingReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalPacingReviewAdjuster implements GlobalPacingReviewStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPacingReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredGlobalPacingReviewAdjuster implements GlobalPacingReviewStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalPacingReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global pacing review steps in order and keeps a trace of each. */
export class GlobalPacingReviewEngine {
  steps: GlobalPacingReviewStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPacingReviewStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalPacingReview): number {
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

  evaluateAll(items: GlobalPacingReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalPacingReviewEngine(): GlobalPacingReviewEngine {
  return new GlobalPacingReviewEngine(
    [
      new TitleGlobalPacingReviewAdjuster(new Map<string, number>([["retail", 1.34], ["west", 1.2]])),
      new CapGlobalPacingReviewAdjuster(41110),
      new TieredGlobalPacingReviewAdjuster([3754, 5774, 5837], [1.04, 1.2, 1.08]),
    ],
    [],
    2.2,
    28272.3,
  );
}
