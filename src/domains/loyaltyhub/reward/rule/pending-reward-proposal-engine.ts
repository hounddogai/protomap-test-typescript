import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingRewardProposal } from "./pending-reward-proposal.js";

/** One step of the pending reward proposal calculation. */
export interface PendingRewardProposalStep {
  describe(): string;
  adjust(item: PendingRewardProposal, value: number): number;
}

export class NamePendingRewardProposalAdjuster implements PendingRewardProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingRewardProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingRewardProposalQuantityOffsetAdjuster implements PendingRewardProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: PendingRewardProposal, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedPendingRewardProposalAdjuster implements PendingRewardProposalStep {
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

  adjust(item: PendingRewardProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingRewardProposalAdjuster implements PendingRewardProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingRewardProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingRewardProposalAdjuster implements PendingRewardProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingRewardProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending reward proposal steps in order and keeps a trace of each. */
export class PendingRewardProposalEngine {
  steps: PendingRewardProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRewardProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingRewardProposal): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PendingRewardProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingRewardProposalEngine(flagsValue: flags.Registry): PendingRewardProposalEngine {
  return new PendingRewardProposalEngine(
    [
      new NamePendingRewardProposalAdjuster(new Map<string, number>([["north", 0.8], ["online", 0.75]])),
      new PendingRewardProposalQuantityOffsetAdjuster(0.17),
      new FlaggedPendingRewardProposalAdjuster(flagsValue, "pending-reward-proposal-seasonal", 0.1),
      new MinimumPendingRewardProposalAdjuster(10.1),
      new PercentPendingRewardProposalAdjuster(-16.9),
    ],
    [],
    2,
    12734,
  );
}
