import * as numbers from "../../../../kit/numbers.js";
import { BatchedQueueProposal } from "./batched-queue-proposal.js";

/** One step of the batched queue proposal calculation. */
export interface BatchedQueueProposalFactor {
  describe(): string;
  adjust(item: BatchedQueueProposal, value: number): number;
}

export class RoundingBatchedQueueProposalAdjuster implements BatchedQueueProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedQueueProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedQueueProposalAdjuster implements BatchedQueueProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedQueueProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedQueueProposalAdjuster implements BatchedQueueProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedQueueProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched queue proposal steps in order and keeps a trace of each. */
export class BatchedQueueProposalEngine {
  steps: BatchedQueueProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedQueueProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedQueueProposal): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BatchedQueueProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedQueueProposalEngine(): BatchedQueueProposalEngine {
  return new BatchedQueueProposalEngine(
    [
      new RoundingBatchedQueueProposalAdjuster(0.05),
      new MinimumBatchedQueueProposalAdjuster(42.9),
      new TieredBatchedQueueProposalAdjuster([2224, 2592, 9402], [1.05, 1.01, 1.12]),
    ],
    [],
    2.3,
    15331.1,
  );
}
