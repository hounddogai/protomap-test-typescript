import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPayoutProposal } from "./pending-payout-proposal.js";

/** One step of the pending payout proposal calculation. */
export interface PendingPayoutProposalModifier {
  describe(): string;
  adjust(item: PendingPayoutProposal, value: number): number;
}

export class MinimumPendingPayoutProposalAdjuster implements PendingPayoutProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPayoutProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingPayoutProposalAdjuster implements PendingPayoutProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPayoutProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocalePendingPayoutProposalAdjuster implements PendingPayoutProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PendingPayoutProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingPayoutProposalAdjuster implements PendingPayoutProposalModifier {
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

  adjust(item: PendingPayoutProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending payout proposal steps in order and keeps a trace of each. */
export class PendingPayoutProposalEngine {
  steps: PendingPayoutProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPayoutProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingPayoutProposal): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PendingPayoutProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingPayoutProposalEngine(flagsValue: flags.Registry): PendingPayoutProposalEngine {
  return new PendingPayoutProposalEngine(
    [
      new MinimumPendingPayoutProposalAdjuster(16.5),
      new CapPendingPayoutProposalAdjuster(11081),
      new LocalePendingPayoutProposalAdjuster(new Map<string, number>([["east", 1.38], ["north", 1]])),
      new FlaggedPendingPayoutProposalAdjuster(flagsValue, "pending-payout-proposal-primary", -6.8),
    ],
    [],
    2.8,
    33358.4,
  );
}
