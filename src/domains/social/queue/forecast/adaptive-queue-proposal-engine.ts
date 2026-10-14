import { AdaptiveQueueProposal } from "./adaptive-queue-proposal.js";

/** One step of the adaptive queue proposal calculation. */
export interface AdaptiveQueueProposalModifier {
  describe(): string;
  adjust(item: AdaptiveQueueProposal, value: number): number;
}

export class MinimumAdaptiveQueueProposalAdjuster implements AdaptiveQueueProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveQueueProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapAdaptiveQueueProposalAdjuster implements AdaptiveQueueProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveQueueProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredAdaptiveQueueProposalAdjuster implements AdaptiveQueueProposalModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveQueueProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class AdaptiveQueueProposalBudgetOffsetAdjuster implements AdaptiveQueueProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: AdaptiveQueueProposal, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the adaptive queue proposal steps in order and keeps a trace of each. */
export class AdaptiveQueueProposalEngine {
  steps: AdaptiveQueueProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveQueueProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveQueueProposal): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: AdaptiveQueueProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveQueueProposalEngine(): AdaptiveQueueProposalEngine {
  return new AdaptiveQueueProposalEngine(
    [
      new MinimumAdaptiveQueueProposalAdjuster(7.5),
      new CapAdaptiveQueueProposalAdjuster(47254),
      new TieredAdaptiveQueueProposalAdjuster([1333, 2077, 3249, 9363], [0.85, 1.09, 0.91, 1.13]),
      new AdaptiveQueueProposalBudgetOffsetAdjuster(0.22),
    ],
    [],
    4.4,
    60712.4,
  );
}
