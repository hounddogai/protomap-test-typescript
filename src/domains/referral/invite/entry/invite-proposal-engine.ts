import * as numbers from "../../../../kit/numbers.js";
import { InviteProposal } from "./invite-proposal.js";

/** One step of the invite proposal calculation. */
export interface InviteProposalFactor {
  describe(): string;
  adjust(item: InviteProposal, value: number): number;
}

export class PercentInviteProposalAdjuster implements InviteProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredInviteProposalAdjuster implements InviteProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingInviteProposalAdjuster implements InviteProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the invite proposal steps in order and keeps a trace of each. */
export class InviteProposalEngine {
  steps: InviteProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InviteProposal): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: InviteProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInviteProposalEngine(): InviteProposalEngine {
  return new InviteProposalEngine(
    [
      new PercentInviteProposalAdjuster(-14.7),
      new TieredInviteProposalAdjuster([178, 3688, 3704], [0.95, 0.85, 0.93]),
      new RoundingInviteProposalAdjuster(5),
    ],
    [],
    2.6,
    81010.1,
  );
}
