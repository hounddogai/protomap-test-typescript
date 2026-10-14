import * as flags from "../../../../kit/flags.js";
import { LenientFunnelProposal } from "./lenient-funnel-proposal.js";

/** One step of the lenient funnel proposal calculation. */
export interface LenientFunnelProposalAdjuster {
  describe(): string;
  adjust(item: LenientFunnelProposal, value: number): number;
}

export class MinimumLenientFunnelProposalAdjuster implements LenientFunnelProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientFunnelProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientFunnelProposalAdjuster implements LenientFunnelProposalAdjuster {
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

  adjust(item: LenientFunnelProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientFunnelProposalAdjuster implements LenientFunnelProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientFunnelProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientFunnelProposalAdjuster implements LenientFunnelProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientFunnelProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient funnel proposal steps in order and keeps a trace of each. */
export class LenientFunnelProposalEngine {
  steps: LenientFunnelProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFunnelProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientFunnelProposal): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientFunnelProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientFunnelProposalEngine(flagsValue: flags.Registry): LenientFunnelProposalEngine {
  return new LenientFunnelProposalEngine(
    [
      new MinimumLenientFunnelProposalAdjuster(46.9),
      new FlaggedLenientFunnelProposalAdjuster(flagsValue, "lenient-funnel-proposal-batched", 2.5),
      new PercentLenientFunnelProposalAdjuster(-22.5),
      new CapLenientFunnelProposalAdjuster(26442),
    ],
    [],
    2.1,
    18065,
  );
}
