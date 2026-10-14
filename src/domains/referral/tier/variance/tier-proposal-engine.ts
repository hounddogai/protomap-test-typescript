import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierProposal } from "./tier-proposal.js";

/** One step of the tier proposal calculation. */
export interface TierProposalFactor {
  describe(): string;
  adjust(item: TierProposal, value: number): number;
}

export class LocaleTierProposalAdjuster implements TierProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TierProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTierProposalAdjuster implements TierProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TierProposalLimitOffsetAdjuster implements TierProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: TierProposal, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class PercentTierProposalAdjuster implements TierProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTierProposalAdjuster implements TierProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTierProposalAdjuster implements TierProposalFactor {
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

  adjust(item: TierProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tier proposal steps in order and keeps a trace of each. */
export class TierProposalEngine {
  steps: TierProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierProposal): number {
    let current = item.netValue();
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

  evaluateAll(items: TierProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierProposalEngine(flagsValue: flags.Registry): TierProposalEngine {
  return new TierProposalEngine(
    [
      new LocaleTierProposalAdjuster(
        new Map<string, number>([["central", 0.81], ["east", 1.35], ["south", 0.79]]),
      ),
      new RoundingTierProposalAdjuster(0.05),
      new TierProposalLimitOffsetAdjuster(0.38),
      new PercentTierProposalAdjuster(-12.7),
      new CapTierProposalAdjuster(11143),
      new FlaggedTierProposalAdjuster(flagsValue, "tier-proposal-rolling", 2.3),
    ],
    [],
    1.6,
    76724.6,
  );
}
