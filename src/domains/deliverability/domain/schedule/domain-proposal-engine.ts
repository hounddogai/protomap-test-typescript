import * as flags from "../../../../kit/flags.js";
import { DomainProposal } from "./domain-proposal.js";

/** One step of the domain proposal calculation. */
export interface DomainProposalFactor {
  describe(): string;
  adjust(item: DomainProposal, value: number): number;
}

export class FlaggedDomainProposalAdjuster implements DomainProposalFactor {
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

  adjust(item: DomainProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDomainProposalAdjuster implements DomainProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDomainProposalAdjuster implements DomainProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the domain proposal steps in order and keeps a trace of each. */
export class DomainProposalEngine {
  steps: DomainProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DomainProposal): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: DomainProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDomainProposalEngine(flagsValue: flags.Registry): DomainProposalEngine {
  return new DomainProposalEngine(
    [
      new FlaggedDomainProposalAdjuster(flagsValue, "domain-proposal-global", -5.9),
      new PercentDomainProposalAdjuster(-1.6),
      new MinimumDomainProposalAdjuster(24.4),
    ],
    [],
    2,
    37618.4,
  );
}
