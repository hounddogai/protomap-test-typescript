import { BatchedPacingProposal } from "./batched-pacing-proposal.js";

/** One step of the batched pacing proposal calculation. */
export interface BatchedPacingProposalAdjuster {
  describe(): string;
  adjust(item: BatchedPacingProposal, value: number): number;
}

export class UtmSourceBatchedPacingProposalAdjuster implements BatchedPacingProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: BatchedPacingProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedPacingProposalAdjuster implements BatchedPacingProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedPacingProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedPacingProposalAdjuster implements BatchedPacingProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPacingProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched pacing proposal steps in order and keeps a trace of each. */
export class BatchedPacingProposalEngine {
  steps: BatchedPacingProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPacingProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedPacingProposal): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: BatchedPacingProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedPacingProposalEngine(): BatchedPacingProposalEngine {
  return new BatchedPacingProposalEngine(
    [
      new UtmSourceBatchedPacingProposalAdjuster(new Map<string, number>([["east", 1.1]])),
      new PercentBatchedPacingProposalAdjuster(-12.2),
      new CapBatchedPacingProposalAdjuster(23742),
    ],
    [],
    2.5,
    79856.5,
  );
}
