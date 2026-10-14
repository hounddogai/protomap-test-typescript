import { SlaReview } from "./sla-review.js";

/** One step of the sla review calculation. */
export interface SlaReviewFactor {
  describe(): string;
  adjust(item: SlaReview, value: number): number;
}

export class CapSlaReviewAdjuster implements SlaReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SlaReviewRatioOffsetAdjuster implements SlaReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: SlaReview, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class TieredSlaReviewAdjuster implements SlaReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumSlaReviewAdjuster implements SlaReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the sla review steps in order and keeps a trace of each. */
export class SlaReviewEngine {
  steps: SlaReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SlaReview): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: SlaReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSlaReviewEngine(): SlaReviewEngine {
  return new SlaReviewEngine(
    [
      new CapSlaReviewAdjuster(12074),
      new SlaReviewRatioOffsetAdjuster(1.45),
      new TieredSlaReviewAdjuster([2064, 8547, 9009, 9297], [1, 0.96, 1.13, 0.84]),
      new MinimumSlaReviewAdjuster(32.4),
    ],
    [],
    4.5,
    12797.9,
  );
}
