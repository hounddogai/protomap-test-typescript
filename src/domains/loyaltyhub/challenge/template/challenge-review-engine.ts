import { ChallengeReview } from "./challenge-review.js";

/** One step of the challenge review calculation. */
export interface ChallengeReviewFactor {
  describe(): string;
  adjust(item: ChallengeReview, value: number): number;
}

export class MinimumChallengeReviewAdjuster implements ChallengeReviewFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredChallengeReviewAdjuster implements ChallengeReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChallengeReviewCapacityOffsetAdjuster implements ChallengeReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: ChallengeReview, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the challenge review steps in order and keeps a trace of each. */
export class ChallengeReviewEngine {
  steps: ChallengeReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ChallengeReview): number {
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

  evaluateAll(items: ChallengeReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultChallengeReviewEngine(): ChallengeReviewEngine {
  return new ChallengeReviewEngine(
    [
      new MinimumChallengeReviewAdjuster(7.4),
      new TieredChallengeReviewAdjuster([3323, 5203], [1.06, 0.89]),
      new ChallengeReviewCapacityOffsetAdjuster(0.22),
    ],
    [],
    1,
    24957.7,
  );
}
