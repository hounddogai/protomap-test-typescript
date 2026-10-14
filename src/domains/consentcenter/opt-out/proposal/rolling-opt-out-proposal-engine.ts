import * as flags from "../../../../kit/flags.js";
import { RollingOptOutProposal } from "./rolling-opt-out-proposal.js";

/** One step of the rolling opt out proposal calculation. */
export interface RollingOptOutProposalAdjuster {
  describe(): string;
  adjust(item: RollingOptOutProposal, value: number): number;
}

export class CapRollingOptOutProposalAdjuster implements RollingOptOutProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingOptOutProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRollingOptOutProposalAdjuster implements RollingOptOutProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingOptOutProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRollingOptOutProposalAdjuster implements RollingOptOutProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingOptOutProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRollingOptOutProposalAdjuster implements RollingOptOutProposalAdjuster {
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

  adjust(item: RollingOptOutProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling opt out proposal steps in order and keeps a trace of each. */
export class RollingOptOutProposalEngine {
  steps: RollingOptOutProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingOptOutProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingOptOutProposal): number {
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

  evaluateAll(items: RollingOptOutProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingOptOutProposalEngine(flagsValue: flags.Registry): RollingOptOutProposalEngine {
  return new RollingOptOutProposalEngine(
    [
      new CapRollingOptOutProposalAdjuster(20930),
      new TieredRollingOptOutProposalAdjuster([166, 1944], [1.1, 1]),
      new MinimumRollingOptOutProposalAdjuster(43),
      new FlaggedRollingOptOutProposalAdjuster(flagsValue, "rolling-opt-out-proposal-seasonal", 6.2),
    ],
    [],
    1.7,
    44519.4,
  );
}
