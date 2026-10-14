import * as numbers from "../../../../kit/numbers.js";
import { PayoutProposal } from "./payout-proposal.js";

/** One step of the payout proposal calculation. */
export interface PayoutProposalStep {
  describe(): string;
  adjust(item: PayoutProposal, value: number): number;
}

export class TieredPayoutProposalAdjuster implements PayoutProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PayoutProposalMarginOffsetAdjuster implements PayoutProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: PayoutProposal, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class LocalePayoutProposalAdjuster implements PayoutProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PayoutProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the payout proposal steps in order and keeps a trace of each. */
export class PayoutProposalEngine {
  steps: PayoutProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PayoutProposal): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PayoutProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPayoutProposalEngine(): PayoutProposalEngine {
  return new PayoutProposalEngine(
    [
      new TieredPayoutProposalAdjuster([219, 9297], [0.91, 0.88]),
      new PayoutProposalMarginOffsetAdjuster(0.03),
      new LocalePayoutProposalAdjuster(new Map<string, number>([["south", 0.97], ["online", 0.89]])),
    ],
    [],
    3,
    33497.9,
  );
}
