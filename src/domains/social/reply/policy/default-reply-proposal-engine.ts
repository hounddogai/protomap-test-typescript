import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultReplyProposal } from "./default-reply-proposal.js";

/** One step of the default reply proposal calculation. */
export interface DefaultReplyProposalFactor {
  describe(): string;
  adjust(item: DefaultReplyProposal, value: number): number;
}

export class SegmentDefaultReplyProposalAdjuster implements DefaultReplyProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: DefaultReplyProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDefaultReplyProposalAdjuster implements DefaultReplyProposalFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: DefaultReplyProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultReplyProposalAdjuster implements DefaultReplyProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultReplyProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default reply proposal steps in order and keeps a trace of each. */
export class DefaultReplyProposalEngine {
  steps: DefaultReplyProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultReplyProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultReplyProposal): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: DefaultReplyProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultReplyProposalEngine(flagsValue: flags.Registry): DefaultReplyProposalEngine {
  return new DefaultReplyProposalEngine(
    [
      new SegmentDefaultReplyProposalAdjuster(new Map<string, number>([["north", 1.39]])),
      new FlaggedDefaultReplyProposalAdjuster(flagsValue, "default-reply-proposal-lenient", 9.5),
      new MinimumDefaultReplyProposalAdjuster(37.9),
    ],
    [],
    2.6,
    24605.9,
  );
}
