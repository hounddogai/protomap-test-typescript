import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyProposal } from "./reply-proposal.js";

/** One step of the reply proposal calculation. */
export interface ReplyProposalFactor {
  describe(): string;
  adjust(item: ReplyProposal, value: number): number;
}

export class FlaggedReplyProposalAdjuster implements ReplyProposalFactor {
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

  adjust(item: ReplyProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReplyProposalAdjuster implements ReplyProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumReplyProposalAdjuster implements ReplyProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentReplyProposalAdjuster implements ReplyProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleReplyProposalAdjuster implements ReplyProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ReplyProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ReplyProposalWeightOffsetAdjuster implements ReplyProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: ReplyProposal, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the reply proposal steps in order and keeps a trace of each. */
export class ReplyProposalEngine {
  steps: ReplyProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReplyProposal): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ReplyProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReplyProposalEngine(flagsValue: flags.Registry): ReplyProposalEngine {
  return new ReplyProposalEngine(
    [
      new FlaggedReplyProposalAdjuster(flagsValue, "reply-proposal-strict", -9.4),
      new TieredReplyProposalAdjuster([1305, 1619, 4642, 5693], [0.96, 1.01, 0.81, 0.91]),
      new MinimumReplyProposalAdjuster(2.2),
      new PercentReplyProposalAdjuster(23.9),
      new LocaleReplyProposalAdjuster(new Map<string, number>([["south", 1.39], ["retail", 0.79]])),
      new ReplyProposalWeightOffsetAdjuster(0.83),
    ],
    [],
    4.7,
    28723.5,
  );
}
