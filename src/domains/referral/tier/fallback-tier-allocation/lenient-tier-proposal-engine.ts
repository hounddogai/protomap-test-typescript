import * as numbers from "../../../../kit/numbers.js";
import { LenientTierProposal } from "./lenient-tier-proposal.js";

/** One step of the lenient tier proposal calculation. */
export interface LenientTierProposalStep {
  describe(): string;
  adjust(item: LenientTierProposal, value: number): number;
}

export class PercentLenientTierProposalAdjuster implements LenientTierProposalStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientTierProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceLenientTierProposalAdjuster implements LenientTierProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: LenientTierProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLenientTierProposalAdjuster implements LenientTierProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientTierProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientTierProposalAdjuster implements LenientTierProposalStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientTierProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLenientTierProposalAdjuster implements LenientTierProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientTierProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LenientTierProposalWindowDaysOffsetAdjuster implements LenientTierProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: LenientTierProposal, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the lenient tier proposal steps in order and keeps a trace of each. */
export class LenientTierProposalEngine {
  steps: LenientTierProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientTierProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientTierProposal): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientTierProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientTierProposalEngine(): LenientTierProposalEngine {
  return new LenientTierProposalEngine(
    [
      new PercentLenientTierProposalAdjuster(-4.4),
      new SourceLenientTierProposalAdjuster(
        new Map<string, number>([["north", 1.24], ["east", 1.27], ["retail", 0.74]]),
      ),
      new TieredLenientTierProposalAdjuster([2453, 4695, 7542, 9448], [1.1, 1.17, 0.94, 0.98]),
      new RoundingLenientTierProposalAdjuster(5),
      new MinimumLenientTierProposalAdjuster(22.2),
      new LenientTierProposalWindowDaysOffsetAdjuster(1.91),
    ],
    [],
    1.2,
    45946.3,
  );
}
