import * as numbers from "../../../../kit/numbers.js";
import { ManualTierProposal } from "./manual-tier-proposal.js";

/** One step of the manual tier proposal calculation. */
export interface ManualTierProposalStep {
  describe(): string;
  adjust(item: ManualTierProposal, value: number): number;
}

export class TitleManualTierProposalAdjuster implements ManualTierProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualTierProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualTierProposalAdjuster implements ManualTierProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualTierProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ManualTierProposalCreatedAtOffsetAdjuster implements ManualTierProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ManualTierProposal, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class PercentManualTierProposalAdjuster implements ManualTierProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTierProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualTierProposalAdjuster implements ManualTierProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualTierProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual tier proposal steps in order and keeps a trace of each. */
export class ManualTierProposalEngine {
  steps: ManualTierProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTierProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualTierProposal): number {
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

  evaluateAll(items: ManualTierProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualTierProposalEngine(): ManualTierProposalEngine {
  return new ManualTierProposalEngine(
    [
      new TitleManualTierProposalAdjuster(new Map<string, number>([["retail", 0.85], ["east", 1.09]])),
      new MinimumManualTierProposalAdjuster(18.8),
      new ManualTierProposalCreatedAtOffsetAdjuster(0.67),
      new PercentManualTierProposalAdjuster(-20.2),
      new TieredManualTierProposalAdjuster([2361, 6378], [1.15, 0.85]),
    ],
    [],
    4.1,
    22342.7,
  );
}
