import { PendingBidRuleScore } from "./pending-bid-rule-score.js";

/** One step of the pending bid rule score calculation. */
export interface PendingBidRuleScoreStep {
  describe(): string;
  adjust(item: PendingBidRuleScore, value: number): number;
}

export class CapPendingBidRuleScoreAdjuster implements PendingBidRuleScoreStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingBidRuleScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingBidRuleScoreAdjuster implements PendingBidRuleScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingBidRuleScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PendingBidRuleScoreEndsAtOffsetAdjuster implements PendingBidRuleScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: PendingBidRuleScore, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the pending bid rule score steps in order and keeps a trace of each. */
export class PendingBidRuleScoreEngine {
  steps: PendingBidRuleScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBidRuleScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingBidRuleScore): number {
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

  evaluateAll(items: PendingBidRuleScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingBidRuleScoreEngine(): PendingBidRuleScoreEngine {
  return new PendingBidRuleScoreEngine(
    [
      new CapPendingBidRuleScoreAdjuster(30260),
      new TieredPendingBidRuleScoreAdjuster([240, 8307], [1.01, 0.95]),
      new PendingBidRuleScoreEndsAtOffsetAdjuster(1.83),
    ],
    [],
    4.6,
    4241.7,
  );
}
