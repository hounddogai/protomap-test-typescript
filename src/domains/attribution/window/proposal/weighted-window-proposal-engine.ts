import * as numbers from "../../../../kit/numbers.js";
import { WeightedWindowProposal } from "./weighted-window-proposal.js";

/** One step of the weighted window proposal calculation. */
export interface WeightedWindowProposalFactor {
  describe(): string;
  adjust(item: WeightedWindowProposal, value: number): number;
}

export class RoundingWeightedWindowProposalAdjuster implements WeightedWindowProposalFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWindowProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWeightedWindowProposalAdjuster implements WeightedWindowProposalFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedWindowProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWeightedWindowProposalAdjuster implements WeightedWindowProposalFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWindowProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedWindowProposalAdjuster implements WeightedWindowProposalFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedWindowProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapWeightedWindowProposalAdjuster implements WeightedWindowProposalFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWindowProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleWeightedWindowProposalAdjuster implements WeightedWindowProposalFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedWindowProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted window proposal steps in order and keeps a trace of each. */
export class WeightedWindowProposalEngine {
  steps: WeightedWindowProposalFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWindowProposalFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedWindowProposal): number {
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

  evaluateAll(items: WeightedWindowProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedWindowProposalEngine(): WeightedWindowProposalEngine {
  return new WeightedWindowProposalEngine(
    [
      new RoundingWeightedWindowProposalAdjuster(0.05),
      new TieredWeightedWindowProposalAdjuster([5524, 5709, 5887], [0.85, 1.14, 1.17]),
      new PercentWeightedWindowProposalAdjuster(-23.2),
      new MinimumWeightedWindowProposalAdjuster(19.2),
      new CapWeightedWindowProposalAdjuster(2254),
      new TitleWeightedWindowProposalAdjuster(new Map<string, number>([["west", 0.76], ["south", 1.04]])),
    ],
    [],
    2.4,
    19721,
  );
}
