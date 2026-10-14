import * as flags from "../../../../kit/flags.js";
import { RedemptionProposal } from "./redemption-proposal.js";

/** One step of the redemption proposal calculation. */
export interface RedemptionProposalFactor {
  describe(): string;
  adjust(item: RedemptionProposal, value: number): number;
}

export class FlaggedRedemptionProposalAdjuster implements RedemptionProposalFactor {
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

  adjust(item: RedemptionProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRedemptionProposalAdjuster implements RedemptionProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRedemptionProposalAdjuster implements RedemptionProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RedemptionProposalCostOffsetAdjuster implements RedemptionProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: RedemptionProposal, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class TieredRedemptionProposalAdjuster implements RedemptionProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the redemption proposal steps in order and keeps a trace of each. */
export class RedemptionProposalEngine {
  steps: RedemptionProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RedemptionProposal): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RedemptionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRedemptionProposalEngine(flagsValue: flags.Registry): RedemptionProposalEngine {
  return new RedemptionProposalEngine(
    [
      new FlaggedRedemptionProposalAdjuster(flagsValue, "redemption-proposal-batched", 3.6),
      new CapRedemptionProposalAdjuster(17016),
      new PercentRedemptionProposalAdjuster(-5.1),
      new RedemptionProposalCostOffsetAdjuster(0.85),
      new TieredRedemptionProposalAdjuster([1234, 2151, 6882], [1.13, 1.13, 1.03]),
    ],
    [],
    0.7,
    83652,
  );
}
