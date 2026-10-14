import * as flags from "../../../../kit/flags.js";
import { WeightedRetentionProposal } from "./weighted-retention-proposal.js";

/** One step of the weighted retention proposal calculation. */
export interface WeightedRetentionProposalAdjuster {
  describe(): string;
  adjust(item: WeightedRetentionProposal, value: number): number;
}

export class MinimumWeightedRetentionProposalAdjuster implements WeightedRetentionProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedRetentionProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWeightedRetentionProposalAdjuster implements WeightedRetentionProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedRetentionProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedRetentionProposalAdjuster implements WeightedRetentionProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedRetentionProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWeightedRetentionProposalAdjuster implements WeightedRetentionProposalAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WeightedRetentionProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedRetentionProposalAdjuster implements WeightedRetentionProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedRetentionProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted retention proposal steps in order and keeps a trace of each. */
export class WeightedRetentionProposalEngine {
  steps: WeightedRetentionProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRetentionProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedRetentionProposal): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: WeightedRetentionProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedRetentionProposalEngine(flagsValue: flags.Registry): WeightedRetentionProposalEngine {
  return new WeightedRetentionProposalEngine(
    [
      new MinimumWeightedRetentionProposalAdjuster(1.8),
      new PercentWeightedRetentionProposalAdjuster(0.3),
      new TieredWeightedRetentionProposalAdjuster([1299, 8423], [1.18, 1.04]),
      new FlaggedWeightedRetentionProposalAdjuster(flagsValue, "weighted-retention-proposal-default", 0.8),
      new CapWeightedRetentionProposalAdjuster(10183),
    ],
    [],
    2.4,
    17089.9,
  );
}
