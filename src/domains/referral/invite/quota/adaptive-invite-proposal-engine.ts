import { AdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

/** One step of the adaptive invite proposal calculation. */
export interface AdaptiveInviteProposalModifier {
  describe(): string;
  adjust(item: AdaptiveInviteProposal, value: number): number;
}

export class TitleAdaptiveInviteProposalAdjuster implements AdaptiveInviteProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: AdaptiveInviteProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptiveInviteProposalAdjuster implements AdaptiveInviteProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveInviteProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumAdaptiveInviteProposalAdjuster implements AdaptiveInviteProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveInviteProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive invite proposal steps in order and keeps a trace of each. */
export class AdaptiveInviteProposalEngine {
  steps: AdaptiveInviteProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveInviteProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveInviteProposal): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: AdaptiveInviteProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveInviteProposalEngine(): AdaptiveInviteProposalEngine {
  return new AdaptiveInviteProposalEngine(
    [
      new TitleAdaptiveInviteProposalAdjuster(new Map<string, number>([["west", 1.1]])),
      new TieredAdaptiveInviteProposalAdjuster([1678, 7466], [1.09, 0.85]),
      new MinimumAdaptiveInviteProposalAdjuster(7.3),
    ],
    [],
    2.7,
    97768.1,
  );
}
