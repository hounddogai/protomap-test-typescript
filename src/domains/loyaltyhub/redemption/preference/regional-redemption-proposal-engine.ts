import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalRedemptionProposal } from "./regional-redemption-proposal.js";

/** One step of the regional redemption proposal calculation. */
export interface RegionalRedemptionProposalAdjuster {
  describe(): string;
  adjust(item: RegionalRedemptionProposal, value: number): number;
}

export class RegionalRedemptionProposalEndsAtOffsetAdjuster implements RegionalRedemptionProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: RegionalRedemptionProposal, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class PercentRegionalRedemptionProposalAdjuster implements RegionalRedemptionProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalRedemptionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalRedemptionProposalAdjuster implements RegionalRedemptionProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalRedemptionProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRegionalRedemptionProposalAdjuster implements RegionalRedemptionProposalAdjuster {
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

  adjust(item: RegionalRedemptionProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalRedemptionProposalAdjuster implements RegionalRedemptionProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalRedemptionProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalRedemptionProposalAdjuster implements RegionalRedemptionProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalRedemptionProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional redemption proposal steps in order and keeps a trace of each. */
export class RegionalRedemptionProposalEngine {
  steps: RegionalRedemptionProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalRedemptionProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalRedemptionProposal): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: RegionalRedemptionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalRedemptionProposalEngine(flagsValue: flags.Registry): RegionalRedemptionProposalEngine {
  return new RegionalRedemptionProposalEngine(
    [
      new RegionalRedemptionProposalEndsAtOffsetAdjuster(0.38),
      new PercentRegionalRedemptionProposalAdjuster(-19.5),
      new TieredRegionalRedemptionProposalAdjuster([6096, 8377], [0.82, 1]),
      new FlaggedRegionalRedemptionProposalAdjuster(flagsValue, "regional-redemption-proposal-seasonal", 7.7),
      new RoundingRegionalRedemptionProposalAdjuster(5),
      new MinimumRegionalRedemptionProposalAdjuster(46.7),
    ],
    [],
    4.7,
    88468.5,
  );
}
