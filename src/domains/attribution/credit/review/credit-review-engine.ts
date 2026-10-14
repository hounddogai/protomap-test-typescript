import { CreditReview } from "./credit-review.js";

/** One step of the credit review calculation. */
export interface CreditReviewModifier {
  describe(): string;
  adjust(item: CreditReview, value: number): number;
}

export class CapCreditReviewAdjuster implements CreditReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CreditReviewRetriesOffsetAdjuster implements CreditReviewModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: CreditReview, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredCreditReviewAdjuster implements CreditReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the credit review steps in order and keeps a trace of each. */
export class CreditReviewEngine {
  steps: CreditReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditReview): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: CreditReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditReviewEngine(): CreditReviewEngine {
  return new CreditReviewEngine(
    [
      new CapCreditReviewAdjuster(40686),
      new CreditReviewRetriesOffsetAdjuster(1.91),
      new TieredCreditReviewAdjuster([456, 8987], [1.16, 1.13]),
    ],
    [],
    4.4,
    24106.1,
  );
}
