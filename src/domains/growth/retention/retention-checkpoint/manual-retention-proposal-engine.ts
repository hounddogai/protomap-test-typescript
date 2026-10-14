import * as numbers from "../../../../kit/numbers.js";
import { ManualRetentionProposal } from "./manual-retention-proposal.js";

/** One step of the manual retention proposal calculation. */
export interface ManualRetentionProposalStep {
  describe(): string;
  adjust(item: ManualRetentionProposal, value: number): number;
}

export class PercentManualRetentionProposalAdjuster implements ManualRetentionProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRetentionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualRetentionProposalAdjuster implements ManualRetentionProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualRetentionProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualRetentionProposalAdjuster implements ManualRetentionProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualRetentionProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleManualRetentionProposalAdjuster implements ManualRetentionProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualRetentionProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualRetentionProposalSendAtOffsetAdjuster implements ManualRetentionProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ManualRetentionProposal, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the manual retention proposal steps in order and keeps a trace of each. */
export class ManualRetentionProposalEngine {
  steps: ManualRetentionProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRetentionProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualRetentionProposal): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ManualRetentionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualRetentionProposalEngine(): ManualRetentionProposalEngine {
  return new ManualRetentionProposalEngine(
    [
      new PercentManualRetentionProposalAdjuster(-2.8),
      new TieredManualRetentionProposalAdjuster([662, 7782, 8147], [0.98, 1.1, 0.92]),
      new CapManualRetentionProposalAdjuster(28486),
      new TitleManualRetentionProposalAdjuster(
        new Map<string, number>([["retail", 1.4], ["east", 1.19], ["online", 1.11]]),
      ),
      new ManualRetentionProposalSendAtOffsetAdjuster(0.38),
    ],
    [],
    4.7,
    43616.7,
  );
}
