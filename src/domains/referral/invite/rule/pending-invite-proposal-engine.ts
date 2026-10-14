import * as numbers from "../../../../kit/numbers.js";
import { PendingInviteProposal } from "./pending-invite-proposal.js";

/** One step of the pending invite proposal calculation. */
export interface PendingInviteProposalModifier {
  describe(): string;
  adjust(item: PendingInviteProposal, value: number): number;
}

export class CategoryPendingInviteProposalAdjuster implements PendingInviteProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PendingInviteProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingInviteProposalBidOffsetAdjuster implements PendingInviteProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PendingInviteProposal, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class PercentPendingInviteProposalAdjuster implements PendingInviteProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingInviteProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingInviteProposalAdjuster implements PendingInviteProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingInviteProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingInviteProposalAdjuster implements PendingInviteProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingInviteProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending invite proposal steps in order and keeps a trace of each. */
export class PendingInviteProposalEngine {
  steps: PendingInviteProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingInviteProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingInviteProposal): number {
    let current = item.netLoad();
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

  evaluateAll(items: PendingInviteProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingInviteProposalEngine(): PendingInviteProposalEngine {
  return new PendingInviteProposalEngine(
    [
      new CategoryPendingInviteProposalAdjuster(
        new Map<string, number>([["north", 1.18], ["retail", 1.05], ["south", 1.01]]),
      ),
      new PendingInviteProposalBidOffsetAdjuster(0.26),
      new PercentPendingInviteProposalAdjuster(19.3),
      new TieredPendingInviteProposalAdjuster([969, 1370, 1697], [0.91, 0.98, 1.06]),
      new CapPendingInviteProposalAdjuster(9512),
    ],
    [],
    2.6,
    36167.8,
  );
}
