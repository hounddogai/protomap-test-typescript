import { ReputationClaim } from "./reputation-claim.js";

/** One step of the reputation claim calculation. */
export interface ReputationClaimAdjuster {
  describe(): string;
  adjust(item: ReputationClaim, value: number): number;
}

export class CapReputationClaimAdjuster implements ReputationClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ReputationClaimRateOffsetAdjuster implements ReputationClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ReputationClaim, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumReputationClaimAdjuster implements ReputationClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reputation claim steps in order and keeps a trace of each. */
export class ReputationClaimEngine {
  steps: ReputationClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationClaim): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ReputationClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationClaimEngine(): ReputationClaimEngine {
  return new ReputationClaimEngine(
    [
      new CapReputationClaimAdjuster(38676),
      new ReputationClaimRateOffsetAdjuster(1.61),
      new MinimumReputationClaimAdjuster(49.5),
    ],
    [],
    0.1,
    21357.3,
  );
}
