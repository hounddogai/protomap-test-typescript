import * as flags from "../../../../kit/flags.js";
import { RegionalPostProposal } from "./regional-post-proposal.js";

/** One step of the regional post proposal calculation. */
export interface RegionalPostProposalFactor {
  describe(): string;
  adjust(item: RegionalPostProposal, value: number): number;
}

export class CapRegionalPostProposalAdjuster implements RegionalPostProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPostProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalPostProposalWindowDaysOffsetAdjuster implements RegionalPostProposalFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RegionalPostProposal, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class TieredRegionalPostProposalAdjuster implements RegionalPostProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPostProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRegionalPostProposalAdjuster implements RegionalPostProposalFactor {
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

  adjust(item: RegionalPostProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional post proposal steps in order and keeps a trace of each. */
export class RegionalPostProposalEngine {
  steps: RegionalPostProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPostProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalPostProposal): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RegionalPostProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalPostProposalEngine(flagsValue: flags.Registry): RegionalPostProposalEngine {
  return new RegionalPostProposalEngine(
    [
      new CapRegionalPostProposalAdjuster(49468),
      new RegionalPostProposalWindowDaysOffsetAdjuster(1.32),
      new TieredRegionalPostProposalAdjuster([106, 2863, 8162], [0.84, 1.08, 1.03]),
      new FlaggedRegionalPostProposalAdjuster(flagsValue, "regional-post-proposal-rolling", -3.8),
    ],
    [],
    2.2,
    47198.7,
  );
}
