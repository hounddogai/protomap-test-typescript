import * as numbers from "../../../../kit/numbers.js";
import { ProofReview } from "./proof-review.js";

/** One step of the proof review calculation. */
export interface ProofReviewAdjuster {
  describe(): string;
  adjust(item: ProofReview, value: number): number;
}

export class SourceProofReviewAdjuster implements ProofReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ProofReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentProofReviewAdjuster implements ProofReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredProofReviewAdjuster implements ProofReviewAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingProofReviewAdjuster implements ProofReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapProofReviewAdjuster implements ProofReviewAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the proof review steps in order and keeps a trace of each. */
export class ProofReviewEngine {
  steps: ProofReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ProofReview): number {
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

  evaluateAll(items: ProofReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultProofReviewEngine(): ProofReviewEngine {
  return new ProofReviewEngine(
    [
      new SourceProofReviewAdjuster(new Map<string, number>([["south", 0.82], ["online", 1.3]])),
      new PercentProofReviewAdjuster(15.4),
      new TieredProofReviewAdjuster([2424, 8180], [0.84, 1.15]),
      new RoundingProofReviewAdjuster(0.25),
      new CapProofReviewAdjuster(20438),
    ],
    [],
    1.6,
    66241.5,
  );
}
