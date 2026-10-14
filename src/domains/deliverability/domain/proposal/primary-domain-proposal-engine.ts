import * as numbers from "../../../../kit/numbers.js";
import { PrimaryDomainProposal } from "./primary-domain-proposal.js";

/** One step of the primary domain proposal calculation. */
export interface PrimaryDomainProposalAdjuster {
  describe(): string;
  adjust(item: PrimaryDomainProposal, value: number): number;
}

export class PercentPrimaryDomainProposalAdjuster implements PrimaryDomainProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryDomainProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimaryDomainProposalAdjuster implements PrimaryDomainProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryDomainProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPrimaryDomainProposalAdjuster implements PrimaryDomainProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryDomainProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary domain proposal steps in order and keeps a trace of each. */
export class PrimaryDomainProposalEngine {
  steps: PrimaryDomainProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryDomainProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryDomainProposal): number {
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

  evaluateAll(items: PrimaryDomainProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryDomainProposalEngine(): PrimaryDomainProposalEngine {
  return new PrimaryDomainProposalEngine(
    [
      new PercentPrimaryDomainProposalAdjuster(-3.2),
      new TieredPrimaryDomainProposalAdjuster([2442, 3344], [0.95, 1.19]),
      new CapPrimaryDomainProposalAdjuster(514),
    ],
    [],
    2.8,
    23496.6,
  );
}
