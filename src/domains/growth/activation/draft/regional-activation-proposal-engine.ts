import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalActivationProposal } from "./regional-activation-proposal.js";

/** One step of the regional activation proposal calculation. */
export interface RegionalActivationProposalFactor {
  describe(): string;
  adjust(item: RegionalActivationProposal, value: number): number;
}

export class TieredRegionalActivationProposalAdjuster implements RegionalActivationProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalActivationProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRegionalActivationProposalAdjuster implements RegionalActivationProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalActivationProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalActivationProposalAdjuster implements RegionalActivationProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalActivationProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionalActivationProposalRatioOffsetAdjuster implements RegionalActivationProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: RegionalActivationProposal, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class FlaggedRegionalActivationProposalAdjuster implements RegionalActivationProposalFactor {
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

  adjust(item: RegionalActivationProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleRegionalActivationProposalAdjuster implements RegionalActivationProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalActivationProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional activation proposal steps in order and keeps a trace of each. */
export class RegionalActivationProposalEngine {
  steps: RegionalActivationProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalActivationProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalActivationProposal): number {
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

  evaluateAll(items: RegionalActivationProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalActivationProposalEngine(flagsValue: flags.Registry): RegionalActivationProposalEngine {
  return new RegionalActivationProposalEngine(
    [
      new TieredRegionalActivationProposalAdjuster([5779, 6112, 6911], [1.19, 0.97, 1.08]),
      new RoundingRegionalActivationProposalAdjuster(0.25),
      new PercentRegionalActivationProposalAdjuster(8.3),
      new RegionalActivationProposalRatioOffsetAdjuster(1.57),
      new FlaggedRegionalActivationProposalAdjuster(flagsValue, "regional-activation-proposal-scheduled", -7.6),
      new LocaleRegionalActivationProposalAdjuster(new Map<string, number>([["north", 1.34]])),
    ],
    [],
    0.1,
    90277.7,
  );
}
