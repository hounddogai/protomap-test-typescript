import * as numbers from "../../../../kit/numbers.js";
import { BatchedChallengeProposal } from "./batched-challenge-proposal.js";

/** One step of the batched challenge proposal calculation. */
export interface BatchedChallengeProposalAdjuster {
  describe(): string;
  adjust(item: BatchedChallengeProposal, value: number): number;
}

export class TieredBatchedChallengeProposalAdjuster implements BatchedChallengeProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedChallengeProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceBatchedChallengeProposalAdjuster implements BatchedChallengeProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedChallengeProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedChallengeProposalAdjuster implements BatchedChallengeProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedChallengeProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedChallengeProposalAdjuster implements BatchedChallengeProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedChallengeProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched challenge proposal steps in order and keeps a trace of each. */
export class BatchedChallengeProposalEngine {
  steps: BatchedChallengeProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedChallengeProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedChallengeProposal): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: BatchedChallengeProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedChallengeProposalEngine(): BatchedChallengeProposalEngine {
  return new BatchedChallengeProposalEngine(
    [
      new TieredBatchedChallengeProposalAdjuster([2292, 4236, 6338], [0.92, 1.04, 0.95]),
      new SourceBatchedChallengeProposalAdjuster(new Map<string, number>([["central", 0.76], ["east", 0.86]])),
      new PercentBatchedChallengeProposalAdjuster(20),
      new CapBatchedChallengeProposalAdjuster(39474),
    ],
    [],
    3.4,
    8885.9,
  );
}
