import * as numbers from "../../../../kit/numbers.js";
import { LenientQueueProposal } from "./lenient-queue-proposal.js";

/** One step of the lenient queue proposal calculation. */
export interface LenientQueueProposalStep {
  describe(): string;
  adjust(item: LenientQueueProposal, value: number): number;
}

export class RoundingLenientQueueProposalAdjuster implements LenientQueueProposalStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientQueueProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelLenientQueueProposalAdjuster implements LenientQueueProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LenientQueueProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLenientQueueProposalAdjuster implements LenientQueueProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientQueueProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLenientQueueProposalAdjuster implements LenientQueueProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientQueueProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient queue proposal steps in order and keeps a trace of each. */
export class LenientQueueProposalEngine {
  steps: LenientQueueProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientQueueProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientQueueProposal): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientQueueProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientQueueProposalEngine(): LenientQueueProposalEngine {
  return new LenientQueueProposalEngine(
    [
      new RoundingLenientQueueProposalAdjuster(0.5),
      new ChannelLenientQueueProposalAdjuster(new Map<string, number>([["retail", 0.77]])),
      new MinimumLenientQueueProposalAdjuster(23.6),
      new PercentLenientQueueProposalAdjuster(3),
    ],
    [],
    2.9,
    70815.5,
  );
}
