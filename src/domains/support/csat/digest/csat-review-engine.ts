import { CsatReview } from "./csat-review.js";

/** One step of the csat review calculation. */
export interface CsatReviewAdjuster {
  describe(): string;
  adjust(item: CsatReview, value: number): number;
}

export class CategoryCsatReviewAdjuster implements CsatReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: CsatReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCsatReviewAdjuster implements CsatReviewAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCsatReviewAdjuster implements CsatReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the csat review steps in order and keeps a trace of each. */
export class CsatReviewEngine {
  steps: CsatReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CsatReview): number {
    let current = item.netExposure();
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

  evaluateAll(items: CsatReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCsatReviewEngine(): CsatReviewEngine {
  return new CsatReviewEngine(
    [
      new CategoryCsatReviewAdjuster(new Map<string, number>([["retail", 0.91], ["online", 1.4]])),
      new TieredCsatReviewAdjuster([935, 2504, 9018], [1.12, 1.18, 0.85]),
      new CapCsatReviewAdjuster(25156),
    ],
    [],
    0.9,
    53670.9,
  );
}
