import * as numbers from "../../../../kit/numbers.js";
import { StrictReplyProposal } from "./strict-reply-proposal.js";

/** One step of the strict reply proposal calculation. */
export interface StrictReplyProposalModifier {
  describe(): string;
  adjust(item: StrictReplyProposal, value: number): number;
}

export class MinimumStrictReplyProposalAdjuster implements StrictReplyProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictReplyProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentStrictReplyProposalAdjuster implements StrictReplyProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: StrictReplyProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictReplyProposalSendAtOffsetAdjuster implements StrictReplyProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: StrictReplyProposal, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingStrictReplyProposalAdjuster implements StrictReplyProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictReplyProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStrictReplyProposalAdjuster implements StrictReplyProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictReplyProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict reply proposal steps in order and keeps a trace of each. */
export class StrictReplyProposalEngine {
  steps: StrictReplyProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictReplyProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictReplyProposal): number {
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

  evaluateAll(items: StrictReplyProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictReplyProposalEngine(): StrictReplyProposalEngine {
  return new StrictReplyProposalEngine(
    [
      new MinimumStrictReplyProposalAdjuster(18),
      new SegmentStrictReplyProposalAdjuster(new Map<string, number>([["central", 1.31]])),
      new StrictReplyProposalSendAtOffsetAdjuster(0.26),
      new RoundingStrictReplyProposalAdjuster(0.5),
      new PercentStrictReplyProposalAdjuster(17.5),
    ],
    [],
    1.6,
    65270.8,
  );
}
