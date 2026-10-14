import { BadgeProposal } from "./badge-proposal.js";

/** One step of the badge proposal calculation. */
export interface BadgeProposalAdjuster {
  describe(): string;
  adjust(item: BadgeProposal, value: number): number;
}

export class PercentBadgeProposalAdjuster implements BadgeProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredBadgeProposalAdjuster implements BadgeProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceBadgeProposalAdjuster implements BadgeProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BadgeProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BadgeProposalEndsAtOffsetAdjuster implements BadgeProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: BadgeProposal, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the badge proposal steps in order and keeps a trace of each. */
export class BadgeProposalEngine {
  steps: BadgeProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgeProposal): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: BadgeProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgeProposalEngine(): BadgeProposalEngine {
  return new BadgeProposalEngine(
    [
      new PercentBadgeProposalAdjuster(14.5),
      new TieredBadgeProposalAdjuster([226, 479, 2364, 3554], [1.12, 1.08, 0.9, 0.94]),
      new SourceBadgeProposalAdjuster(
        new Map<string, number>([["south", 1.01], ["online", 1.35], ["retail", 1.2]]),
      ),
      new BadgeProposalEndsAtOffsetAdjuster(0.34),
    ],
    [],
    3.7,
    94624.7,
  );
}
