import { BidRuleMilestone } from "./bid-rule-milestone.js";

/** One step of the bid rule milestone calculation. */
export interface BidRuleMilestoneFactor {
  describe(): string;
  adjust(item: BidRuleMilestone, value: number): number;
}

export class MinimumBidRuleMilestoneAdjuster implements BidRuleMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBidRuleMilestoneAdjuster implements BidRuleMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBidRuleMilestoneAdjuster implements BidRuleMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the bid rule milestone steps in order and keeps a trace of each. */
export class BidRuleMilestoneEngine {
  steps: BidRuleMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BidRuleMilestone): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: BidRuleMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBidRuleMilestoneEngine(): BidRuleMilestoneEngine {
  return new BidRuleMilestoneEngine(
    [
      new MinimumBidRuleMilestoneAdjuster(12.3),
      new CapBidRuleMilestoneAdjuster(35682),
      new TieredBidRuleMilestoneAdjuster([3915, 5046], [0.82, 0.95]),
    ],
    [],
    2.1,
    15639.4,
  );
}
