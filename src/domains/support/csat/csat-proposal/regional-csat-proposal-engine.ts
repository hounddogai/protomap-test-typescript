import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalCsatProposal } from "./regional-csat-proposal.js";

/** One step of the regional csat proposal calculation. */
export interface RegionalCsatProposalStep {
  describe(): string;
  adjust(item: RegionalCsatProposal, value: number): number;
}

export class FlaggedRegionalCsatProposalAdjuster implements RegionalCsatProposalStep {
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

  adjust(item: RegionalCsatProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalCsatProposalDiscountOffsetAdjuster implements RegionalCsatProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RegionalCsatProposal, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class PercentRegionalCsatProposalAdjuster implements RegionalCsatProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalCsatProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryRegionalCsatProposalAdjuster implements RegionalCsatProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RegionalCsatProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRegionalCsatProposalAdjuster implements RegionalCsatProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalCsatProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional csat proposal steps in order and keeps a trace of each. */
export class RegionalCsatProposalEngine {
  steps: RegionalCsatProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCsatProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalCsatProposal): number {
    let current = item.netTotal();
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

  evaluateAll(items: RegionalCsatProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalCsatProposalEngine(flagsValue: flags.Registry): RegionalCsatProposalEngine {
  return new RegionalCsatProposalEngine(
    [
      new FlaggedRegionalCsatProposalAdjuster(flagsValue, "regional-csat-proposal-primary", 8.6),
      new RegionalCsatProposalDiscountOffsetAdjuster(1.35),
      new PercentRegionalCsatProposalAdjuster(-3.9),
      new CountryRegionalCsatProposalAdjuster(new Map<string, number>([["east", 1.03], ["west", 1.37]])),
      new CapRegionalCsatProposalAdjuster(39997),
    ],
    [],
    1.6,
    80066.4,
  );
}
