import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualReputationProposal } from "./manual-reputation-proposal.js";

/** One step of the manual reputation proposal calculation. */
export interface ManualReputationProposalModifier {
  describe(): string;
  adjust(item: ManualReputationProposal, value: number): number;
}

export class PercentManualReputationProposalAdjuster implements ManualReputationProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualReputationProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedManualReputationProposalAdjuster implements ManualReputationProposalModifier {
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

  adjust(item: ManualReputationProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ManualReputationProposalGraceDaysOffsetAdjuster implements ManualReputationProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ManualReputationProposal, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapManualReputationProposalAdjuster implements ManualReputationProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualReputationProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual reputation proposal steps in order and keeps a trace of each. */
export class ManualReputationProposalEngine {
  steps: ManualReputationProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualReputationProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualReputationProposal): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ManualReputationProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualReputationProposalEngine(flagsValue: flags.Registry): ManualReputationProposalEngine {
  return new ManualReputationProposalEngine(
    [
      new PercentManualReputationProposalAdjuster(22.8),
      new FlaggedManualReputationProposalAdjuster(flagsValue, "manual-reputation-proposal-seasonal", -6.6),
      new ManualReputationProposalGraceDaysOffsetAdjuster(0.19),
      new CapManualReputationProposalAdjuster(16315),
    ],
    [],
    0.8,
    67780.3,
  );
}
