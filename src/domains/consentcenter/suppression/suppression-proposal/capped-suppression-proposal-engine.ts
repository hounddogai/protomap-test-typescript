import * as flags from "../../../../kit/flags.js";
import { CappedSuppressionProposal } from "./capped-suppression-proposal.js";

/** One step of the capped suppression proposal calculation. */
export interface CappedSuppressionProposalAdjuster {
  describe(): string;
  adjust(item: CappedSuppressionProposal, value: number): number;
}

export class FlaggedCappedSuppressionProposalAdjuster implements CappedSuppressionProposalAdjuster {
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

  adjust(item: CappedSuppressionProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedSuppressionProposalAdjuster implements CappedSuppressionProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedSuppressionProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCappedSuppressionProposalAdjuster implements CappedSuppressionProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedSuppressionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped suppression proposal steps in order and keeps a trace of each. */
export class CappedSuppressionProposalEngine {
  steps: CappedSuppressionProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSuppressionProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedSuppressionProposal): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: CappedSuppressionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedSuppressionProposalEngine(flagsValue: flags.Registry): CappedSuppressionProposalEngine {
  return new CappedSuppressionProposalEngine(
    [
      new FlaggedCappedSuppressionProposalAdjuster(flagsValue, "capped-suppression-proposal-batched", 9.7),
      new CapCappedSuppressionProposalAdjuster(42884),
      new PercentCappedSuppressionProposalAdjuster(-9.4),
    ],
    [],
    0.6,
    24969.8,
  );
}
