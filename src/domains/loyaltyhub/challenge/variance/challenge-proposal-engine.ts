import * as numbers from "../../../../kit/numbers.js";
import { ChallengeProposal } from "./challenge-proposal.js";

/** One step of the challenge proposal calculation. */
export interface ChallengeProposalFactor {
  describe(): string;
  adjust(item: ChallengeProposal, value: number): number;
}

export class MinimumChallengeProposalAdjuster implements ChallengeProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredChallengeProposalAdjuster implements ChallengeProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentChallengeProposalAdjuster implements ChallengeProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ChallengeProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapChallengeProposalAdjuster implements ChallengeProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingChallengeProposalAdjuster implements ChallengeProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChallengeProposalScoreOffsetAdjuster implements ChallengeProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ChallengeProposal, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the challenge proposal steps in order and keeps a trace of each. */
export class ChallengeProposalEngine {
  steps: ChallengeProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ChallengeProposal): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ChallengeProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultChallengeProposalEngine(): ChallengeProposalEngine {
  return new ChallengeProposalEngine(
    [
      new MinimumChallengeProposalAdjuster(35.4),
      new TieredChallengeProposalAdjuster([3122, 4617], [1.1, 0.81]),
      new SegmentChallengeProposalAdjuster(
        new Map<string, number>([["central", 1.05], ["west", 1.39], ["retail", 1.02]]),
      ),
      new CapChallengeProposalAdjuster(36573),
      new RoundingChallengeProposalAdjuster(0.05),
      new ChallengeProposalScoreOffsetAdjuster(0.53),
    ],
    [],
    4.4,
    53470.3,
  );
}
